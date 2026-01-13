import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { supabase } from '../services/client';
import { User, UserRole } from '../types';
import { auditService } from '../services/supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasRole: (roles: UserRole[]) => boolean;
    isStaff: () => boolean;
    canManage: (targetRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const prevUserRef = useRef<User | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) handleUser(session.user, false); // Don't log initial session load
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                // Only log login events, not token refreshes or other auth state changes
                const shouldLogLogin = event === 'SIGNED_IN';
                handleUser(session.user, shouldLogLogin);
            } else {
                // Log logout if user was previously logged in
                const prevUser = prevUserRef.current;
                if (prevUser) {
                    auditService.logEvent({
                        eventType: 'LOGIN',
                        resourceType: 'AUTH',
                        details: `${prevUser.name || prevUser.email} cerró sesión`,
                        status: 'Informativo'
                    });
                }
                setUser(null);
                prevUserRef.current = null;
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUser = async (sessionUser: any, shouldLogLogin: boolean = false) => {
        setLoading(true);
        try {
            console.log('Fetching profile for session user:', sessionUser.email);
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            let finalUser: User | null = null;

            if (error) {
                if (error.code === 'PGRST116') {
                    // Profile not found - truly a new user
                    console.log('No profile found, defaulting to cliente');
                    finalUser = {
                        id: sessionUser.id,
                        name: sessionUser.email.split('@')[0],
                        email: sessionUser.email,
                        role: 'cliente' as UserRole,
                    };
                } else {
                    console.error('Database error fetching profile:', error);
                    // Critical error (RLS, connection, etc.) - don't just fallback silently
                    // But we must set some state to stop loading
                    finalUser = {
                        id: sessionUser.id,
                        name: sessionUser.email.split('@')[0],
                        email: sessionUser.email,
                        role: 'cliente' as UserRole,
                    };
                }
            } else if (profile) {
                console.log('Role successfully detected from DB:', profile.role);
                finalUser = {
                    id: sessionUser.id,
                    name: profile.full_name || sessionUser.email.split('@')[0],
                    email: sessionUser.email,
                    role: profile.role as UserRole,
                    notification_email: profile.notification_email,
                    phone_number: profile.phone_number,
                    status: profile.status,
                    avatar: profile.avatar_url
                };
            }

            if (finalUser) {
                prevUserRef.current = finalUser;
                setUser(finalUser);
                
                // Log login event if this is a new sign-in
                if (shouldLogLogin) {
                    auditService.logEvent({
                        eventType: 'LOGIN',
                        resourceType: 'AUTH',
                        details: `${finalUser.name || finalUser.email} inició sesión`,
                        userName: finalUser.name
                    });
                }
            }
        } catch (err) {
            console.error('Critical Auth Error in handleUser:', err);
        } finally {
            setLoading(false);
        }
    };

    const hasRole = (roles: UserRole[]) => user ? roles.includes(user.role) : false;
    const isStaff = () => user ? ['super_admin', 'admin', 'recepcionista'].includes(user.role) : false;

    const refreshUser = async () => {
        const { data: { user: sessionUser } } = await supabase.auth.getUser();
        if (sessionUser) {
            await handleUser(sessionUser);
        }
    };

    const canManage = (targetRole: UserRole) => {
        if (!user) return false;
        if (user.role === 'super_admin') return ['admin', 'recepcionista', 'cliente'].includes(targetRole);
        if (user.role === 'admin') return ['recepcionista', 'cliente'].includes(targetRole);
        if (user.role === 'recepcionista') return targetRole === 'cliente';
        return false;
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signOut: () => supabase.auth.signOut(),
            refreshUser,
            hasRole,
            isStaff,
            canManage
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
