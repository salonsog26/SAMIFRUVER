import React from 'react';
import '../../styles/variables.css';

function Badge({ categoria }) {
    // Asignamos la clase CSS dependiendo de la categoría
    let colorClass = 'badge-default';

    if (categoria === 'Verduras') colorClass = 'badge-verduras';
    if (categoria === 'Frutas') colorClass = 'badge-frutas';
    if (categoria === 'Especias') colorClass = 'badge-especias';

    return (
        <span className={`badge ${colorClass}`}>
            {categoria}
        </span>
    );
}

export default Badge;