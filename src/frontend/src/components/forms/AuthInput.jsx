import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../../styles/variables.css';

// Campo de formulario con etiqueta. Si type="password" muestra el botón de ojo (mostrar/ocultar).
function AuthInput({ label, type = "text", value = "", onChange, error = "", placeholder = "", autoComplete }) {
    const id = useId();
    const [visible, setVisible] = useState(false);
    const esPassword = type === 'password';

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor={id} style={{ color: '#10271B', fontSize: 14, fontFamily: 'Inter' }}>{label}</label>
            <div
                className={`form-input-wrapper ${error ? 'input-error' : ''}`}
                style={{
                    height: 50,
                    padding: '0 16px',
                    background: error ? '#FFF1F0' : 'white',
                    borderRadius: 12,
                    border: error ? '1.5px solid #D92D20' : '1px solid #DDE7DF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}
            >
                <input
                    id={id}
                    type={esPassword && visible ? 'text' : type}
                    aria-invalid={error ? 'true' : undefined}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: '#10271B', fontSize: 16, fontFamily: 'Inter, sans-serif' }}
                />
                {esPassword && (
                    <button
                        type="button"
                        className="input-eye-btn"
                        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setVisible(!visible)}
                    >
                        {visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                )}
            </div>
            {typeof error === 'string' && error && <span className="error-text" role="alert">{error}</span>}
        </div>
    );
}

export default AuthInput;
