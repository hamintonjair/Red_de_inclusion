# backend/app/controllers/asistente_controller.py
from flask import request, jsonify, send_file
from bson import ObjectId
from datetime import datetime
import logging
import pandas as pd
from io import BytesIO
from functools import wraps

# Configurar el logger
logger = logging.getLogger(__name__)

def validar_objectid(id_str):
    """Valida que un string sea un ObjectId válido"""
    if not id_str:
        return False
    return ObjectId.is_valid(id_str)

def configurar_asistente_routes(app, db):
    # ==================================================
    # Endpoints para la gestión general de asistentes
    # ==================================================
    
    @app.route('/api/asistentes', methods=['GET'])
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
    
    @app.route('/api/asistentes', methods=['POST'])
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
    
    @app.route('/api/asistentes/<asistente_id>', methods=['GET'])
    def obtener_asistente(asistente_id):
        """
        Obtiene un asistente por su ID
        """
        try:
            if not validar_objectid(asistente_id):
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
    
    @app.route('/api/asistentes/<asistente_id>', methods=['PUT'])
    def actualizar_asistente(asistente_id):
        """
        Actualiza un asistente existente
        """
        try:
            if not validar_objectid(asistente_id):
                return jsonify({
                    'success': False,
                    'message': 'ID de asistente no válido'
                }), 400
            
            data = request.get_json()
            
            # Validar que el asistente exista
            asistente = db.asistentes.find_one({'_id': ObjectId(asistente_id)})
            if not asistente:
                return jsonify({
                    'success': False,
                    'message': 'Asistente no encontrado'
                }), 404
            
            # Validar cédula única si se está actualizando
            if 'cedula' in data and data['cedula'] != asistente['cedula']:
                if db.asistentes.find_one({'cedula': data['cedula']}):
                    return jsonify({
                        'success': False,
                        'message': 'Ya existe otro asistente con esta cédula'
                    }), 400
            
            # Validar email único si se está actualizando
            if 'email' in data and data.get('email') and data['email'] != asistente.get('email', ''):
                if db.asistentes.find_one({'email': data['email']}):
                    return jsonify({
                        'success': False,
                        'message': 'Ya existe otro asistente con este correo electrónico'
                    }), 400
            
            # Preparar la actualización
            update_data = {
                'tipo': 'funcionario',
                'nombre': data.get('nombre', asistente['nombre']),
                'cedula': data.get('cedula', asistente['cedula']),
                'dependencia': data.get('dependencia', asistente['dependencia']),
                'cargo': data.get('cargo', asistente['cargo']),
                'tipo_participacion': data.get('tipo_participacion', asistente['tipo_participacion']),
                'telefono': data.get('telefono', asistente.get('telefono', '')),
                'email': data.get('email', asistente.get('email', '')),
                'fecha_actualizacion': datetime.utcnow()
            }
            
            # Actualizar en la base de datos
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
            logger.error(f'Error al actualizar asistente: {str(e)}')
            return jsonify({
                'success': False,
                'message': 'Error al actualizar el asistente',
                'error': str(e)
            }), 500
    
    @app.route('/api/asistentes/<asistente_id>', methods=['DELETE'])
    def eliminar_asistente(asistente_id):
        """
        Elimina un asistente
        """
        try:
            if not validar_objectid(asistente_id):
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
    
    # ==================================================
    # Endpoints para la gestión de asistentes en actividades
    # ==================================================
    
    @app.route('/api/actividades/<actividad_id>/asistentes', methods=['GET'])
    def obtener_asistentes(actividad_id):
        """
        Obtiene todos los asistentes de una actividad
        """
        try:
            # Verificar si la actividad existe
            actividad = db.actividades.find_one({
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

    @app.route('/api/actividades/<actividad_id>/asistentes', methods=['POST'])
    def guardar_asistentes(actividad_id):
        """
        Guarda o actualiza los asistentes de una actividad
        """
        try:
            data = request.get_json()
            if not data or 'asistentes' not in data:
                return jsonify({
                    'success': False,
                    'message': 'No se proporcionaron datos de asistentes'
                }), 400
            
            asistentes = data['asistentes']
            
            # Validar que los asistentes sean una lista
            if not isinstance(asistentes, list):
                return jsonify({
                    'success': False,
                    'message': 'Los asistentes deben ser una lista'
                }), 400
            
            # Validar la estructura de cada asistente
            for i, asistente in enumerate(asistentes):
                campos_requeridos = ['tipo', 'nombre', 'cedula', 'dependencia', 'cargo', 'tipo_participacion']
                
                if 'tipo' not in asistente:
                    return jsonify({
                        'success': False,
                        'message': f'El asistente en la posición {i} no tiene el campo "tipo"'
                    }), 400
                
                if asistente['tipo'] not in ['beneficiario', 'funcionario']:
                    return jsonify({
                        'success': False,
                        'message': f'Tipo de asistente no válido en la posición {i}. Debe ser "beneficiario" o "funcionario"'
                    }), 400
                
                # Validar campos requeridos según el tipo
                if asistente['tipo'] == 'beneficiario':
                    if 'beneficiario_id' not in asistente:
                        return jsonify({
                            'success': False,
                            'message': f'El asistente beneficiario en la posición {i} no tiene el campo "beneficiario_id"'
                        }), 400
                else:  # funcionario
                    for campo in campos_requeridos[1:]:  # Excluimos 'tipo' que ya lo validamos
                        if campo not in asistente or not asistente[campo]:
                            return jsonify({
                                'success': False,
                                'message': f'El campo "{campo}" es requerido para el asistente en la posición {i}'
                            }), 400
            
            # Actualizar la actividad con los nuevos asistentes
            result = db.actividades.update_one(
                {'_id': ObjectId(actividad_id)},
                {
                    '$set': {
                        'asistentes': asistentes,
                        'fecha_actualizacion': datetime.utcnow()
                    }
                }
            )
            
            if result.matched_count == 0:
                return jsonify({
                    'success': False,
                    'message': 'No se encontró la actividad especificada'
                }), 404
            
            return jsonify({
                'success': True,
                'message': 'Asistentes guardados correctamente',
                'count': len(asistentes)
            })
            
        except Exception as e:
            logger.error(f'Error al guardar asistentes: {str(e)}')
            return jsonify({
                'success': False,
                'message': 'Error al guardar los asistentes',
                'error': str(e)
            }), 500

    @app.route('/api/actividades/<actividad_id>/asistentes/exportar', methods=['GET'])
    def exportar_asistentes(actividad_id):
        """
        Exporta los asistentes de una actividad a Excel
        """
        try:
            # Obtener la actividad
            actividad = db.actividades.find_one({
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
