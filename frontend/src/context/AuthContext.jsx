import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Al cargar la app, intentamos recuperar la sesión desde localStorage
        const savedUser = localStorage.getItem('workshop_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const userData = {
                username: response.data.username,
                role: response.data.role,
                token: response.data.access_token
            };
            setUser(userData);
            localStorage.setItem('workshop_user', JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            console.error('Error in login:', error);
            return { success: false, message: error.response?.data?.detail || 'Error de conexión' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('workshop_user');
    };

    const isAdmin = () => user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
