
import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

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

    const markAsRead = async (id: string) => {
        const { error } = await notificationService.markAsRead(id);
        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const { error } = await notificationService.markAllAsRead(user.id);
        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            loading
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
