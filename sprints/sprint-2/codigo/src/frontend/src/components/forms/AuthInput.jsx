// src/components/forms/AuthInput.jsx
import React, { useId } from 'react';
import '../../styles/variables.css';

function AuthInput({ label, type = "text", value = "", onChange, error = "" }) {
    const id = useId();
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
                    alignItems: 'center'
                }}
            >
                <input
                    id={id}
                    type={type}
                    aria-invalid={error ? 'true' : undefined}
                    value={value}
                    onChange={onChange}
                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: '#68786F', fontSize: 16 }}
                />
            </div>
            {typeof error === 'string' && error && <span className="error-text" role="alert">{error}</span>}
        </div>
    );
}

export default AuthInput;