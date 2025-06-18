# backend/app/routes/actividad.py
from flask import Blueprint, request
from app.controllers.actividad_controller import (
    crear_actividad, obtener_actividades, obtener_actividad,
    actualizar_actividad, eliminar_actividad, registrar_asistencias,
    exportar_actividad, subir_logo
)

actividad_bp = Blueprint('actividad', __name__)

@actividad_bp.route('', methods=['GET'])
def obtener_actividades_route():
    return obtener_actividades()

@actividad_bp.route('', methods=['POST'])
def crear_actividad_route():
    return crear_actividad()

@actividad_bp.route('/<actividad_id>', methods=['GET'])
def obtener_actividad_route(actividad_id):
    return obtener_actividad(actividad_id)

@actividad_bp.route('/<actividad_id>', methods=['PUT'])
def actualizar_actividad_route(actividad_id):
    # Si no hay token, usar un usuario por defecto
    from flask import g
    if not hasattr(g, 'user_id'):
        g.user_id = 'sistema'  # Usuario por defecto cuando no hay autenticación
    return actualizar_actividad(actividad_id)

@actividad_bp.route('/<actividad_id>', methods=['DELETE'])
def eliminar_actividad_route(actividad_id):
    return eliminar_actividad(actividad_id)

@actividad_bp.route('/<actividad_id>/asistentes', methods=['POST'])
def registrar_asistencias_route(actividad_id):
    return registrar_asistencias(actividad_id)

@actividad_bp.route('/<actividad_id>/exportar-excel', methods=['GET'])
def exportar_actividad_route(actividad_id):
    # Si no hay token, usar un usuario por defecto
    from flask import g, request, jsonify
    if not hasattr(g, 'user_id'):
        g.user_id = 'sistema'  # Usuario por defecto cuando no hay autenticación
    
    # Obtener parámetros de consulta
    columnas = request.args.get('columnas')
    if columnas:
        try:
            columnas = columnas.split(',')
        except:
            return jsonify({'error': 'Formato de columnas inválido'}), 400
    
    # Deshabilitar temporalmente la verificación JWT para esta ruta
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    from functools import wraps
    
    def jwt_optional(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request(optional=True)
            except:
                pass
            return fn(*args, **kwargs)
        return wrapper
    
    @jwt_optional
    def exportar_con_jwt_opcional(actividad_id):
        return exportar_actividad(actividad_id, columnas=columnas)
        
    return exportar_con_jwt_opcional(actividad_id)

@actividad_bp.route('/upload-logo', methods=['POST'])
def subir_logo_route():
    return subir_logo()