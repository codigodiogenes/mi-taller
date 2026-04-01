import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

/**
 * Componente de Breadcrumbs (migas de pan) para navegación
 * @param {Array} items - Array de objetos con {label, to}
 * Ejemplo: [{label: 'Inicio', to: '/'}, {label: 'Garaje', to: '/motorcycles'}]
 */
export default function Breadcrumbs({ items = [] }) {
    const { theme } = useTheme();

    if (!items || items.length === 0) return null;

    return (
        <nav className="flex items-center gap-2 text-sm mb-6">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isFirst = index === 0;

                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <ChevronRight
                                size={14}
                                className="text-slate-300 dark:text-slate-700"
                            />
                        )}
                        {isLast ? (
                            <span className={cn(
                                "font-black uppercase tracking-widest text-[10px]",
                                theme === 'dark' ? "text-slate-400" : "text-slate-500"
                            )}>
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                to={item.to}
                                className={cn(
                                    "font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-1.5",
                                    theme === 'dark'
                                        ? "text-slate-600 hover:text-blue-400"
                                        : "text-slate-400 hover:text-blue-600"
                                )}
                            >
                                {isFirst && <Home size={12} />}
                                {item.label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
