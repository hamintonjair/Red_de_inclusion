# backend/app/routes/actividad.py
from flask import Blueprint, request, jsonify
from app.controllers.actividad_controller import (
    crear_actividad, obtener_actividades, obtener_actividad,
    actualizar_actividad, eliminar_actividad, registrar_asistencias,
    exportar_actividad, subir_logo, guardar_asistentes
)
from bson import ObjectId
import logging

# Configurar el logger
logger = logging.getLogger(__name__)

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

# Rutas para el manejo de asistentes
@actividad_bp.route('/<actividad_id>/asistentes', methods=['GET'])
def obtener_asistentes_route(actividad_id):
    """
    Obtiene todos los asistentes de una actividad
    """
    try:
        from app import mongo
        
        # Verificar si la actividad existe
        actividad = mongo.db.actividades.find_one({
            '_id': ObjectId(actividad_id)
        })
        
        if not actividad:
            return jsonify({
                'success': False,
                'message': 'Actividad no encontrada'
            }), 404
        
        # Obtener los asistentes de la actividad
        asistentes = actividad.get('asistentes', [])
        
        return jsonify({
            'success': True,
            'data': asistentes,
            'count': len(asistentes)
        })
        
    except Exception as e:
        logger.error(f'Error al obtener asistentes: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al obtener los asistentes',
            'error': str(e)
        }), 500

@actividad_bp.route('/<actividad_id>/asistentes/exportar', methods=['GET'])
def exportar_asistentes_route(actividad_id):
    """
    Exporta los asistentes de una actividad a Excel
    """
    try:
        import pandas as pd
        from io import BytesIO
        from flask import send_file
        from app import mongo
        
        # Obtener la actividad
        actividad = mongo.db.actividades.find_one({
            '_id': ObjectId(actividad_id)
        })
        
        if not actividad:
            return jsonify({
                'success': False,
                'message': 'Actividad no encontrada'
            }), 404
        
        asistentes = actividad.get('asistentes', [])
        
        if not asistentes:
            return jsonify({
                'success': False,
                'message': 'No hay asistentes para exportar'
            }), 400
        
        # Crear un DataFrame con los datos de los asistentes
        df = pd.DataFrame(asistentes)
        
        # Ordenar columnas
        columnas_ordenadas = [
            'nombre', 'cedula', 'dependencia', 'cargo', 'tipo_participacion',
            'telefono', 'email', 'asistio', 'observaciones'
        ]
        
        # Mantener solo las columnas que existen en los datos
        columnas_existentes = [col for col in columnas_ordenadas if col in df.columns]
        df = df[columnas_existentes]
        
        # Crear un archivo Excel en memoria
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Asistentes')
            
            # Ajustar el ancho de las columnas
            worksheet = writer.sheets['Asistentes']
            for i, col in enumerate(df.columns):
                max_length = max(df[col].astype(str).apply(len).max(), len(col)) + 2
                worksheet.column_dimensions[chr(65 + i)].width = min(max_length, 30)
        
        output.seek(0)
        
        # Crear la respuesta con el archivo Excel
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'asistentes_actividad_{actividad_id}.xlsx'
        )
        
    except Exception as e:
        logger.error(f'Error al exportar asistentes: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al exportar los asistentes',
            'error': str(e)
        }), 500

@actividad_bp.route('/<actividad_id>/guardar-asistentes', methods=['POST'])
def guardar_asistentes_route(actividad_id):
    """
    Guarda o actualiza los asistentes de una actividad
    """
    try:
        # Verificar si el usuario está autenticado
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request()
        
        # Obtener el ID del usuario autenticado
        usuario_actual = get_jwt_identity()
        if not usuario_actual:
            return jsonify({
                'success': False,
                'message': 'No autorizado. Se requiere autenticación.'
            }), 401
            
        # Procesar la solicitud a través del controlador
        return guardar_asistentes(actividad_id)
        
    except Exception as e:
        logger.error(f'Error en la ruta de guardar asistentes: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al procesar la solicitud',
            'error': str(e)
        }), 500