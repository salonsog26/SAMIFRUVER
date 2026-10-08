import React from 'react';
import { CircleHelp } from 'lucide-react';
import '../../styles/variables.css';

function ContentHeader({ migas }) {
    return (
        <header className="content-topbar">
            <span className="breadcrumb-text">{migas}</span>
            <a href="#ayuda" className="help-link">
                <CircleHelp size={16} />
                Ayuda
            </a>
        </header>
    );
}

export default ContentHeader;
