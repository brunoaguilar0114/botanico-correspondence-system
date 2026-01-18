
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/client';
import { notificationService } from '../services/supabase';
import { Notification } from '../types';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    loading: boolean;
    onNotificationClick: (notification: Notification) => void;
    setNavigationHandler: (handler: (correspondenceId: string) => void) => void;
    // Modal de detalle
    selectedNotification: Notification | null;
    isDetailModalOpen: boolean;
    closeDetailModal: () => void;
    navigateToCorrespondence: (correspondenceId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const navigationHandlerRef = useRef<((correspondenceId: string) => void) | null>(null);

    // Estado para el modal de detalle
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        const { data, error } = await notificationService.getNotifications(user.id);
        if (!error && data) {
            setNotifications(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        fetchNotifications();

        // Subscribe to REALTIME changes for the current user's notifications
        const channel = supabase
            .channel(`user-notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotif = payload.new as Notification;
                        setNotifications(prev => [newNotif, ...prev].slice(0, 20));
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedNotif = payload.new as Notification;
                        setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const markAsRead = useCallback(async (id: string) => {
        const { error } = await notificationService.markAsRead(id);
        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!user) return;
        const { error } = await notificationService.markAllAsRead(user.id);
        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const setNavigationHandler = useCallback((handler: (correspondenceId: string) => void) => {
        navigationHandlerRef.current = handler;
    }, []);

    const onNotificationClick = useCallback(async (notification: Notification) => {
        // Mark as read
        await markAsRead(notification.id);

        // Abrir modal de detalle en lugar de navegar directamente
        setSelectedNotification(notification);
        setIsDetailModalOpen(true);
    }, [markAsRead]);

    const closeDetailModal = useCallback(() => {
        setIsDetailModalOpen(false);
        setSelectedNotification(null);
    }, []);

    const navigateToCorrespondence = useCallback((correspondenceId: string) => {
        closeDetailModal();
        if (navigationHandlerRef.current) {
            navigationHandlerRef.current(correspondenceId);
        }
    }, [closeDetailModal]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            loading,
            onNotificationClick,
            setNavigationHandler,
            // Modal de detalle
            selectedNotification,
            isDetailModalOpen,
            closeDetailModal,
            navigateToCorrespondence
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationSystem = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationSystem must be used within a NotificationSystemProvider');
    }
    return context;
};
