import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FuncionarioLayout from '../components/layout/FuncionarioLayout';
import Dashboard from '../pages/funcionario/Dashboard';
import Beneficiarios from '../pages/funcionario/Beneficiarios';
import ListadoBeneficiarios from '../pages/funcionario/ListadoBeneficiarios';
import RegistroBeneficiarios from '../pages/funcionario/RegistroBeneficiarios';
import EditarBeneficiario from '../pages/funcionario/EditarBeneficiario';
import Perfil from '../pages/funcionario/Perfil';

const FuncionarioRoutes = () => {
    return (
        <Routes>
            <Route path="" element={<FuncionarioLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                
                {/* Dashboard */}
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Beneficiarios */}
                <Route path="beneficiarios" element={<Beneficiarios />}>
                    <Route index element={<ListadoBeneficiarios />} />
                    <Route path="registro" element={<RegistroBeneficiarios />} />
                    <Route path="editar/:id" element={<EditarBeneficiario />} />
                </Route>
                
                {/* Perfil */}
                <Route path="perfil" element={<Perfil />} />
                
                {/* Ruta por defecto */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default FuncionarioRoutes;
