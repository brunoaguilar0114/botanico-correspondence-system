import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface DeleteUserPayload {
  userId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client with service role (for admin operations)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuración de servidor incompleta.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header to verify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the caller's user info
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'No se pudo verificar la identidad del usuario.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the caller's profile to check their role
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'No se pudo obtener el perfil del usuario.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request payload
    const { userId }: DeleteUserPayload = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'El ID del usuario es obligatorio.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the target user's profile
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has associated correspondence
    const { count: correspondenceCount } = await supabaseAdmin
      .from('correspondence')
      .select('*', { count: 'exact', head: true })
      .or(`recipient_id.eq.${userId},delivered_by.eq.${userId}`);

    const hasAssociatedData = (correspondenceCount || 0) > 0;

    // Permission check based on role hierarchy and associated data
    const canDelete = (() => {
      // super_admin can delete anyone (except other super_admins) regardless of associated data
      if (callerProfile.role === 'super_admin') {
        if (targetProfile.role === 'super_admin') {
          return { allowed: false, reason: 'No se puede eliminar a otro super administrador.' };
        }
        return { allowed: true, reason: null };
      }

      // admin can only delete recepcionista and cliente WITHOUT associated data
      if (callerProfile.role === 'admin') {
        if (!['recepcionista', 'cliente'].includes(targetProfile.role)) {
          return { allowed: false, reason: 'No tienes permisos para eliminar este rol.' };
        }
        if (hasAssociatedData) {
          return { allowed: false, reason: 'El usuario tiene correspondencia asociada. Solo un super administrador puede eliminarlo.' };
        }
        return { allowed: true, reason: null };
      }

      // recepcionista can only delete cliente WITHOUT associated data
      if (callerProfile.role === 'recepcionista') {
        if (targetProfile.role !== 'cliente') {
          return { allowed: false, reason: 'No tienes permisos para eliminar este rol.' };
        }
        if (hasAssociatedData) {
          return { allowed: false, reason: 'El usuario tiene correspondencia asociada. Solo un super administrador puede eliminarlo.' };
        }
        return { allowed: true, reason: null };
      }

      return { allowed: false, reason: 'No tienes permisos para eliminar usuarios.' };
    })();

    if (!canDelete.allowed) {
      return new Response(
        JSON.stringify({ error: canDelete.reason }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${caller.email} (${callerProfile.role}) deleting user ${targetProfile.email} with ${correspondenceCount || 0} associated records`);

    // Begin cascade deletion

    // 1. Delete avatars from storage
    const avatarPath = `${userId}/`;
    const { data: avatarFiles } = await supabaseAdmin.storage
      .from('avatars')
      .list(userId);

    if (avatarFiles && avatarFiles.length > 0) {
      const filesToDelete = avatarFiles.map(f => `${userId}/${f.name}`);
      await supabaseAdmin.storage.from('avatars').remove(filesToDelete);
      console.log(`Deleted ${filesToDelete.length} avatar files`);
    }

    // 2. Get correspondence IDs to delete related attachments
    const { data: correspondenceRecords } = await supabaseAdmin
      .from('correspondence')
      .select('id')
      .eq('recipient_id', userId);

    if (correspondenceRecords && correspondenceRecords.length > 0) {
      const correspondenceIds = correspondenceRecords.map(c => c.id);

      // Delete attachment files from storage
      for (const corrId of correspondenceIds) {
        const { data: attachmentFiles } = await supabaseAdmin.storage
          .from('digitized-files')
          .list(`digitized/${corrId}`);

        if (attachmentFiles && attachmentFiles.length > 0) {
          const filesToDelete = attachmentFiles.map(f => `digitized/${corrId}/${f.name}`);
          await supabaseAdmin.storage.from('digitized-files').remove(filesToDelete);
        }
      }

      // Delete attachment records from DB
      await supabaseAdmin
        .from('correspondence_attachments')
        .delete()
        .in('correspondence_id', correspondenceIds);
    }

    // 3. Update correspondence - remove recipient_id reference
    await supabaseAdmin
      .from('correspondence')
      .update({ recipient_id: null })
      .eq('recipient_id', userId);

    // 4. Update correspondence - remove delivered_by reference
    await supabaseAdmin
      .from('correspondence')
      .update({ delivered_by: null })
      .eq('delivered_by', userId);

    // 5. Delete notifications for this user
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    // 6. Log audit event before deleting profile
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        event_type: 'DELETE',
        resource_type: 'USER',
        resource_id: userId,
        details: `${caller.email} (${callerProfile.role}) eliminó usuario ${targetProfile.email} (${targetProfile.role}). Correspondencia asociada: ${correspondenceCount || 0} registros.`,
        user_name: caller.email,
        status: 'Completado'
      });

    // 7. Delete profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Error deleting profile:', profileDeleteError);
      return new Response(
        JSON.stringify({ error: `Error al eliminar perfil: ${profileDeleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Delete user from auth.users
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      // Profile is already deleted, log this error but don't fail completely
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          event_type: 'ERROR',
          resource_type: 'USER',
          resource_id: userId,
          details: `Error al eliminar usuario de auth: ${authDeleteError.message}`,
          user_name: caller.email,
          status: 'Fallido'
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuario ${targetProfile.email} eliminado correctamente.`,
        deletedData: {
          correspondenceUnlinked: correspondenceCount || 0,
          avatarsDeleted: avatarFiles?.length || 0
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge Function Internal Error:', error);
    return new Response(
      JSON.stringify({ error: `Error interno: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
