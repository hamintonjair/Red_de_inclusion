# backend/app/routes/asistente.py
from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import logging

# Configurar el logger
logger = logging.getLogger(__name__)

# Crear el blueprint
asistente_bp = Blueprint('asistente', __name__)

# Variable global para la base de datos
db = None

@asistente_bp.route('', methods=['GET'])
def listar_asistentes():
    """
    Obtiene todos los asistentes
    """
    try:
        # Obtener parámetros de consulta
        tipo = request.args.get('tipo')
        query = {}
        
        if tipo:
            query['tipo'] = tipo
        
        # Obtener asistentes
        asistentes = list(db.asistentes.find(query))
        
        # Convertir ObjectId a string
        for asistente in asistentes:
            asistente['_id'] = str(asistente['_id'])
        
        return jsonify({
            'success': True,
            'data': asistentes,
            'count': len(asistentes)
        })
        
    except Exception as e:
        logger.error(f'Error al listar asistentes: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al listar los asistentes',
            'error': str(e)
        }), 500

@asistente_bp.route('', methods=['POST'])
def crear_asistente():
    """
    Crea un nuevo asistente
    """
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        campos_requeridos = ['nombre', 'cedula', 'dependencia', 'cargo', 'tipo_participacion']
        for campo in campos_requeridos:
            if campo not in data or not data[campo]:
                return jsonify({
                    'success': False,
                    'message': f'El campo {campo} es requerido'
                }), 400
        
        # Validar cédula única
        if db.asistentes.find_one({'cedula': data['cedula']}):
            return jsonify({
                'success': False,
                'message': 'Ya existe un asistente con esta cédula'
            }), 400
        
        # Validar email único si se proporciona
        if 'email' in data and data['email']:
            if db.asistentes.find_one({'email': data['email']}):
                return jsonify({
                    'success': False,
                    'message': 'Ya existe un asistente con este correo electrónico'
                }), 400
        
        # Crear el asistente
        asistente = {
            'tipo': 'funcionario',
            'nombre': data['nombre'],
            'cedula': data['cedula'],
            'dependencia': data['dependencia'],
            'cargo': data['cargo'],
            'tipo_participacion': data['tipo_participacion'],
            'telefono': data.get('telefono', ''),
            'email': data.get('email', ''),
            'fecha_creacion': datetime.utcnow(),
            'fecha_actualizacion': datetime.utcnow()
        }
        
        # Insertar en la base de datos
        result = db.asistentes.insert_one(asistente)
        asistente['_id'] = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'message': 'Asistente creado correctamente',
            'data': asistente
        }), 201
        
    except Exception as e:
        logger.error(f'Error al crear asistente: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al crear el asistente',
            'error': str(e)
        }), 500

@asistente_bp.route('/<asistente_id>', methods=['GET'])
def obtener_asistente(asistente_id):
    """
    Obtiene un asistente por su ID
    """
    try:
        if not ObjectId.is_valid(asistente_id):
            return jsonify({
                'success': False,
                'message': 'ID de asistente no válido'
            }), 400
        
        asistente = db.asistentes.find_one({'_id': ObjectId(asistente_id)})
        
        if not asistente:
            return jsonify({
                'success': False,
                'message': 'Asistente no encontrado'
            }), 404
        
        asistente['_id'] = str(asistente['_id'])
        
        return jsonify({
            'success': True,
            'data': asistente
        })
        
    except Exception as e:
        logger.error(f'Error al obtener asistente: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al obtener el asistente',
            'error': str(e)
        }), 500

@asistente_bp.route('/<asistente_id>', methods=['PUT'])
def actualizar_asistente(asistente_id):
    """
    Actualiza un asistente
    """
    try:
        from bson import ObjectId
        
        if not ObjectId.is_valid(asistente_id):
            return jsonify({
                'success': False,
                'message': 'ID de asistente no válido'
            }), 400
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No se proporcionaron datos para actualizar'
            }), 400
        
        # Verificar si el asistente existe
        asistente = db.asistentes.find_one({'_id': ObjectId(asistente_id)})
        if not asistente:
            return jsonify({
                'success': False,
                'message': 'Asistente no encontrado'
            }), 404
        
        # Validar cédula única si se está actualizando
        if 'cedula' in data and data['cedula'] != asistente.get('cedula'):
            if db.asistentes.find_one({'cedula': data['cedula'], '_id': {'$ne': ObjectId(asistente_id)}}):
                return jsonify({
                    'success': False,
                    'message': 'Ya existe otro asistente con esta cédula'
                }), 400
        
        # Validar email único si se está actualizando
        if 'email' in data and data.get('email') and data['email'] != asistente.get('email', ''):
            if db.asistentes.find_one({'email': data['email'], '_id': {'$ne': ObjectId(asistente_id)}}):
                return jsonify({
                    'success': False,
                    'message': 'Ya existe otro asistente con este correo electrónico'
                }), 400
        
        # Preparar los datos para actualizar
        update_data = {}
        campos_permitidos = ['nombre', 'cedula', 'dependencia', 'cargo', 'tipo_participacion', 'telefono', 'email']
        
        for campo in campos_permitidos:
            if campo in data:
                update_data[campo] = data[campo]
        
        # Agregar fecha de actualización
        update_data['fecha_actualizacion'] = datetime.utcnow()
        
        # Actualizar el asistente
        result = db.asistentes.update_one(
            {'_id': ObjectId(asistente_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'message': 'No se pudo actualizar el asistente'
            }), 400
        
        # Obtener el asistente actualizado
        asistente_actualizado = db.asistentes.find_one({'_id': ObjectId(asistente_id)})
        asistente_actualizado['_id'] = str(asistente_actualizado['_id'])
        
        return jsonify({
            'success': True,
            'message': 'Asistente actualizado correctamente',
            'data': asistente_actualizado
        })
        
    except Exception as e:
        logger.error(f'Error al actualizar asistente: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'message': 'Error al actualizar el asistente',
            'error': str(e)
        }), 500
    
@asistente_bp.route('/<asistente_id>', methods=['DELETE'])
def eliminar_asistente(asistente_id):
    """
    Elimina un asistente
    """
    try:
        from bson import ObjectId
        
        if not ObjectId.is_valid(asistente_id):
            return jsonify({
                'success': False,
                'message': 'ID de asistente no válido'
            }), 400
        
        # Verificar si el asistente existe
        asistente = db.asistentes.find_one({'_id': ObjectId(asistente_id)})
        if not asistente:
            return jsonify({
                'success': False,
                'message': 'Asistente no encontrado'
            }), 404
        
        # Verificar si el asistente está siendo usado en alguna actividad
        actividad_con_asistente = db.actividades.find_one({
            'asistentes.asistente_id': ObjectId(asistente_id)
        })
        
        if actividad_con_asistente:
            return jsonify({
                'success': False,
                'message': 'No se puede eliminar el asistente porque está registrado en una o más actividades'
            }), 400
        
        # Eliminar el asistente
        result = db.asistentes.delete_one({'_id': ObjectId(asistente_id)})
        
        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'message': 'No se pudo eliminar el asistente'
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Asistente eliminado correctamente'
        })
        
    except Exception as e:
        logger.error(f'Error al eliminar asistente: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Error al eliminar el asistente',
            'error': str(e)
        }), 500

def init_asistente_routes(app, database):
    """
    Inicializa las rutas de asistentes
    """
    global db
    db = database
    
    # Registrar el blueprint con el prefijo /api/asistentes
    app.register_blueprint(asistente_bp, url_prefix='/api/asistentes')
    
    logger.info("Rutas de asistentes configuradas correctamente")
