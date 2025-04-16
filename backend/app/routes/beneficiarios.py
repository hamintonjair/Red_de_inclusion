from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from ..models.beneficiario import beneficiario_schema, beneficiarios_schema
import pandas as pd
import io
from datetime import datetime
import math

beneficiarios_bp = Blueprint('beneficiarios', __name__)

@beneficiarios_bp.route('/registrar', methods=['POST'])
@jwt_required()
def registrar_beneficiario():
    try:
        # Obtener ID del funcionario desde el token
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})

        if not funcionario:
            return jsonify({"msg": "Funcionario no encontrado"}), 404

        # Solo funcionarios pueden registrar beneficiarios
        if funcionario['rol'] != 'funcionario':
            return jsonify({"msg": "Solo funcionarios pueden registrar beneficiarios"}), 403

        # Obtener datos del beneficiario
        data = request.get_json()

        # Validar datos con schema
        try:
            beneficiario_validado = beneficiario_schema.load(data)
        except ValidationError as err:
            return jsonify({
                "msg": "Error de validación",
                "errors": err.messages
            }), 400

        # Insertar en base de datos
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        result = beneficiarios.insert_one(beneficiario_validado)

        return jsonify({
            "msg": "Beneficiario registrado exitosamente",
            "beneficiario_id": str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({"msg": f"Error al registrar beneficiario: {str(e)}"}), 500


@beneficiarios_bp.route('/listar', methods=['GET'])
@jwt_required()
def listar_beneficiarios():
    try:
        # Obtener parámetros de la solicitud
        pagina = int(request.args.get('pagina', 1))
        por_pagina = int(request.args.get('por_pagina', 10))
        filtro = request.args.get('filtro', '')
        linea_trabajo = request.args.get('linea_trabajo')

        # Obtener ID del usuario desde el token
        funcionario_id = get_jwt_identity()
        
        # Obtener colecciones
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        lineas_trabajo = current_app.config['MONGO_DB']['lineas_trabajo']

        # Obtener funcionario
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})

        # Validar existencia del funcionario
        if not funcionario:
            return jsonify({"msg": "Funcionario no encontrado"}), 404

        # Validar rol del funcionario
        if funcionario['rol'] not in ['admin', 'usuario', 'funcionario']:
            return jsonify({"msg": "No tienes permisos para listar beneficiarios"}), 403

        # Construir filtro de búsqueda
        filtro_query = {}
        
        # Filtrar por línea de trabajo si se proporciona
        if linea_trabajo:
            # Buscar el ID de la línea de trabajo por su nombre
            linea_trabajo_obj = lineas_trabajo.find_one({'nombre': linea_trabajo})
            if linea_trabajo_obj:
                filtro_query['linea_trabajo'] = str(linea_trabajo_obj['_id'])
            else:
                # Si no se encuentra por nombre, intentar buscar por ID
                try:
                    filtro_query['linea_trabajo'] = linea_trabajo
                except:
                    # Si no se puede convertir, no aplicar filtro de línea de trabajo
                    pass
        
        # Filtrar por rango de fechas si se proporcionan
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        from datetime import datetime
        if fecha_inicio and fecha_fin:
            try:
                from datetime import datetime
                inicio = datetime.fromisoformat(fecha_inicio)
                if len(fecha_fin) == 10:
                    fin = datetime.fromisoformat(fecha_fin)
                    fin = fin.replace(hour=23, minute=59, second=59, microsecond=999999)
                else:
                    fin = datetime.fromisoformat(fecha_fin)
                # Filtro robusto: por tipo fecha y por string ISO
                filtro_query['$or'] = [
                    {
                        'fecha_registro': {
                            '$gte': inicio,
                            '$lte': fin
                        }
                    },
                    {
                        'fecha_registro': {
                            '$gte': fecha_inicio,
                            '$lte': fecha_fin
                        }
                    }
                ]
            except Exception as e:
                pass
        
        # Filtro adicional por texto
        if filtro:
            filtro_query['$or'] = [
                {'nombre_completo': {'$regex': filtro, '$options': 'i'}},
                {'funcionario_nombre': {'$regex': filtro, '$options': 'i'}},
                {'numero_documento': {'$regex': filtro, '$options': 'i'}}
            ]

        # Obtener lista de beneficiarios con paginación y orden descendente por fecha_registro
        total_beneficiarios = beneficiarios.count_documents(filtro_query)
        lista_beneficiarios = list(beneficiarios.find(filtro_query)
            .sort('fecha_registro', -1)
            .skip((pagina - 1) * por_pagina)
            .limit(por_pagina)
        )

        # Enriquecer beneficiarios con nombre de línea de trabajo y fecha legible
        from datetime import datetime
        for beneficiario in lista_beneficiarios:
            beneficiario['_id'] = str(beneficiario['_id'])
            
            # Obtener nombre de línea de trabajo
            if 'linea_trabajo' in beneficiario:
                linea_trabajo_obj = lineas_trabajo.find_one({'_id': ObjectId(beneficiario['linea_trabajo'])})
                beneficiario['nombre_linea_trabajo'] = linea_trabajo_obj['nombre'] if linea_trabajo_obj else 'Sin línea de trabajo'
            # Normalizar fecha_registro
            if 'fecha_registro' in beneficiario:
                if isinstance(beneficiario['fecha_registro'], datetime):
                    beneficiario['fecha_registro'] = beneficiario['fecha_registro'].strftime('%Y-%m-%d')
                else:
                    beneficiario['fecha_registro'] = str(beneficiario['fecha_registro'])[:10]

        # Retornar resultados
        return jsonify({
            "beneficiarios": lista_beneficiarios,
            "total": total_beneficiarios,
            "pagina_actual": pagina,
            "total_paginas": math.ceil(total_beneficiarios / por_pagina)
        })

    except Exception as e:
        return jsonify({"msg": f"Error al listar beneficiarios: {str(e)}"}), 500


@beneficiarios_bp.route('/detalle/<beneficiario_id>', methods=['GET'])
@jwt_required()
def detalle_beneficiario(beneficiario_id):
    try:
        # Obtener colecciones
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        lineas_trabajo = current_app.config['MONGO_DB']['lineas_trabajo']
        
        # Buscar beneficiario
        beneficiario = beneficiarios.find_one({'_id': ObjectId(beneficiario_id)})
        
        if not beneficiario:
            return jsonify({"msg": "Beneficiario no encontrado"}), 404
        
        # Convertir ObjectId a string
        beneficiario['_id'] = str(beneficiario['_id'])
        
        # Obtener nombre de línea de trabajo si existe
        if 'linea_trabajo' in beneficiario:
            linea_trabajo_obj = lineas_trabajo.find_one({'_id': ObjectId(beneficiario['linea_trabajo'])})
            beneficiario['nombre_linea_trabajo'] = linea_trabajo_obj['nombre'] if linea_trabajo_obj else 'Sin línea de trabajo'
        
        return jsonify(beneficiario), 200

    except Exception as e:
        return jsonify({"msg": f"Error al obtener detalles del beneficiario: {str(e)}"}), 500

@beneficiarios_bp.route('/estadisticas/por-mes', methods=['GET'])
@jwt_required()
def beneficiarios_por_mes():
    try:
        # Verificar rol del usuario
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})
        
        # MODIFICACIÓN: Solo administradores pueden ver estadísticas
        if funcionario['rol'] != 'admin':
            return jsonify({"msg": "No tienes permisos para ver estadísticas"}), 403
        
        # Obtener beneficiarios
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        
        # Agrupar beneficiarios por mes de registro
        pipeline = [
            {
                '$addFields': {
                    'fecha_registro_dt': {
                        '$cond': [
                            {'$eq': [
                                {'$type': "$fecha_registro"}, 'string']},
                            {
                                '$cond': [
                                    {'$regexMatch': {'input': "$fecha_registro", 'regex': r"^\\d{4}-\\d{2}-\\d{2}$"}},
                                    { '$dateFromString': { 'dateString': "$fecha_registro", 'format': "%Y-%m-%d" } },
                                    { '$dateFromString': { 'dateString': "$fecha_registro" } }
                                ]
                            },
                            "$fecha_registro"
                        ]
                    }
                }
            },
            {
                '$group': {
                    '_id': {'$dateToString': {'format': '%Y-%m', 'date': '$fecha_registro_dt'}},
                    'cantidad': {'$sum': 1}
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'mes': '$_id',
                    'cantidad': 1
                }
            },
            {'$sort': {'mes': 1}}
        ]
        
        resultado = list(beneficiarios.aggregate(pipeline))
        
        return jsonify(resultado), 200
    
    except Exception as e:
        return jsonify({"msg": f"Error al obtener estadísticas: {str(e)}"}), 500

@beneficiarios_bp.route('/estadisticas/poblaciones-vulnerables', methods=['GET'])
@jwt_required()
def poblaciones_vulnerables():
    try:
        # Verificar rol del usuario
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})
        
        # MODIFICACIÓN: Solo administradores pueden ver estadísticas
        if funcionario['rol'] != 'admin':
            return jsonify({"msg": "No tienes permisos para ver estadísticas"}), 403
        
        # Obtener beneficiarios
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        
        # Agrupar por poblaciones vulnerables
        pipeline = [
            {
                '$facet': {
                    'discapacidad': [
                        {'$match': {'discapacidad': True}},
                        {'$count': 'cantidad'}
                    ],
                    'victimas': [
                        {'$match': {'victima': True}},
                        {'$count': 'cantidad'}
                    ],
                    'jovenes': [
                        {'$match': {'$and': [
                            {'edad': {'$gte': 18, '$lte': 29}}
                        ]}},
                        {'$count': 'cantidad'}
                    ],
                    'tercera_edad': [
                        {'$match': {'$and': [
                            {'edad': {'$gte': 60}}
                        ]}},
                        {'$count': 'cantidad'}
                    ]
                }
            },
            {
                '$project': {
                    'poblaciones': [
                        {'poblacion': 'Personas con Discapacidad', 'cantidad': {'$arrayElemAt': ['$discapacidad.cantidad', 0]}},
                        {'poblacion': 'Víctimas', 'cantidad': {'$arrayElemAt': ['$victimas.cantidad', 0]}},
                        {'poblacion': 'Jóvenes', 'cantidad': {'$arrayElemAt': ['$jovenes.cantidad', 0]}},
                        {'poblacion': 'Tercera Edad', 'cantidad': {'$arrayElemAt': ['$tercera_edad.cantidad', 0]}}
                    ]
                }
            },
            {'$unwind': '$poblaciones'},
            {'$replaceRoot': {'newRoot': '$poblaciones'}}
        ]
        
        resultado = list(beneficiarios.aggregate(pipeline))
        
        return jsonify(resultado), 200
    
    except Exception as e:
        return jsonify({"msg": f"Error al obtener estadísticas de poblaciones vulnerables: {str(e)}"}), 500

@beneficiarios_bp.route('/actualizar/<beneficiario_id>', methods=['PUT'])
@jwt_required()
def actualizar_beneficiario(beneficiario_id):
    try:
        # Obtener ID del funcionario desde el token
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})

        if not funcionario:
            return jsonify({"msg": "Funcionario no encontrado"}), 404

        # Obtener datos de la solicitud
        datos = request.get_json()
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']

        # Verificar si el documento o correo ya existen, excluyendo el beneficiario actual
        documento_existente = beneficiarios.find_one({
            'numero_documento': datos.get('numero_documento'),
            '_id': {'$ne': ObjectId(beneficiario_id)}
        })

        correo_existente = beneficiarios.find_one({
            'correo_electronico': datos.get('correo_electronico'),
            '_id': {'$ne': ObjectId(beneficiario_id)}
        }) if datos.get('correo_electronico') else None

        # Verificar conflictos
        if documento_existente:
            return jsonify({
                "msg": "El número de documento ya está registrado para otro beneficiario",
                "campo": "numero_documento"
            }), 400

        if correo_existente:
            return jsonify({
                "msg": "El correo electrónico ya está registrado para otro beneficiario",
                "campo": "correo_electronico"
            }), 400

        # Actualizar beneficiario
        resultado = beneficiarios.update_one(
            {'_id': ObjectId(beneficiario_id)},
            {'$set': datos}
        )

        if resultado.modified_count == 0:
            return jsonify({"msg": "No se realizaron cambios"}), 200

        return jsonify({
            "msg": "Beneficiario actualizado exitosamente",
            "beneficiario_id": beneficiario_id
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error al actualizar beneficiario: {str(e)}")
        return jsonify({"msg": f"Error interno al actualizar beneficiario: {str(e)}"}), 500

@beneficiarios_bp.route('/verificar-documento/<numero_documento>', methods=['GET'])
@jwt_required()
def verificar_documento_unico(numero_documento):
    try:
        # Obtener ID del funcionario desde el token
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})

        if not funcionario:
            return jsonify({"msg": "Funcionario no encontrado"}), 404

        # Solo funcionarios pueden verificar documentos
        if funcionario['rol'] not in ['funcionario', 'admin']:
            return jsonify({"msg": "No tienes permisos para verificar documentos"}), 403

        # Buscar beneficiario con el mismo número de documento
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        beneficiario_existente = beneficiarios.find_one({
            'numero_documento': numero_documento
        })

        return jsonify({
            "existe": beneficiario_existente is not None,
            "msg": "Documento verificado" if beneficiario_existente is None else "Documento ya registrado"
        }), 200

    except Exception as e:
        return jsonify({"msg": f"Error al verificar documento: {str(e)}"}), 500

@beneficiarios_bp.route('/verificar-correo/<correo_electronico>', methods=['GET'])
@jwt_required()
def verificar_correo_unico(correo_electronico):
    try:
        # Obtener ID del funcionario desde el token
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})

        if not funcionario:
            return jsonify({"msg": "Funcionario no encontrado"}), 404

        # Solo funcionarios pueden verificar correos
        if funcionario['rol'] not in ['funcionario', 'admin']:
            return jsonify({"msg": "No tienes permisos para verificar correos"}), 403

        # Buscar beneficiario con el mismo correo electrónico
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        beneficiario_existente = beneficiarios.find_one({
            'correo_electronico': correo_electronico
        })

        return jsonify({
            "existe": beneficiario_existente is not None,
            "msg": "Correo verificado" if beneficiario_existente is None else "Correo ya registrado"
        }), 200

    except Exception as e:
        return jsonify({"msg": f"Error al verificar correo: {str(e)}"}), 500

@beneficiarios_bp.route('/<beneficiario_id>', methods=['DELETE'])
@jwt_required()
def eliminar_beneficiario(beneficiario_id):
    try:
        # Obtener ID del funcionario desde el token
        funcionario_id = get_jwt_identity()
        funcionarios = current_app.config['MONGO_DB']['funcionarios']
        funcionario = funcionarios.find_one({'_id': ObjectId(funcionario_id)})

        if not funcionario:
            return jsonify({"msg": "Funcionario no encontrado"}), 404

        # Verificar permisos (solo admin o funcionario pueden eliminar)
        if funcionario.get('rol') not in ['admin', 'funcionario']:
            return jsonify({"msg": "No tienes permisos para eliminar beneficiarios"}), 403

        # Obtener colección de beneficiarios
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']

        # Buscar el beneficiario
        beneficiario = beneficiarios.find_one({'_id': ObjectId(beneficiario_id)})
        
        if not beneficiario:
            return jsonify({"msg": "Beneficiario no encontrado"}), 404

        # Eliminar beneficiario
        resultado = beneficiarios.delete_one({'_id': ObjectId(beneficiario_id)})

        if resultado.deleted_count == 0:
            return jsonify({"msg": "No se pudo eliminar el beneficiario"}), 500

        return jsonify({
            "msg": "Beneficiario eliminado exitosamente",
            "beneficiario_id": beneficiario_id
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error al eliminar beneficiario: {str(e)}")
        return jsonify({"msg": f"Error interno al eliminar beneficiario: {str(e)}"}), 500

@beneficiarios_bp.route('/beneficiarios', methods=['GET'])
@jwt_required()
def obtener_beneficiarios():
    try:
        # Obtener parámetros de la solicitud
        pagina = int(request.args.get('pagina', 1))
        por_pagina = int(request.args.get('por_pagina', 10))
        filtro = request.args.get('filtro', '')
        es_admin = request.args.get('admin', 'false').lower() == 'true'

        # Configurar la colección de beneficiarios
        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        
        # Construir pipeline de agregación base
        pipeline = []

        # Filtro de texto si existe
        if filtro:
            pipeline.append({
                '$match': {
                    '$or': [
                        {'nombre_completo': {'$regex': filtro, '$options': 'i'}},
                        {'numero_documento': {'$regex': filtro, '$options': 'i'}}
                    ]
                }
            })

        # Etapa de ordenamiento
        pipeline.append({'$sort': {'fecha_registro': -1}})

        # Si no es admin, filtrar solo beneficiarios activos
        if not es_admin:
            pipeline.append({
                '$match': {'estado': 'Activo'}
            })

        # Etapa de conteo total
        pipeline_conteo = pipeline.copy()
        pipeline_conteo.append({'$count': 'total'})

        # Contar total de registros
        total_registros = list(beneficiarios.aggregate(pipeline_conteo))
        total = total_registros[0]['total'] if total_registros else 0

        # Agregar paginación solo si no se solicitan todos los registros
        if por_pagina < 1000000:  
            pipeline.extend([
                {'$skip': (pagina - 1) * por_pagina},
                {'$limit': por_pagina}
            ])

        # Ejecutar pipeline
        resultado = list(beneficiarios.aggregate(pipeline))

        # Si se solicitan todos los registros, devolver todo
        if por_pagina >= 1000000:
            return jsonify({
                'beneficiarios': resultado,
                'total': total,
                'pagina': 1,
                'por_pagina': total
            }), 200

        return jsonify({
            'beneficiarios': resultado,
            'total': total,
            'pagina': pagina,
            'por_pagina': por_pagina
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error al obtener beneficiarios: {str(e)}")
        return jsonify({
            "msg": f"Error al obtener beneficiarios: {str(e)}",
            "beneficiarios": [],
            "total": 0
        }), 500


@beneficiarios_bp.route('/exportar-beneficiarios-excel', methods=['GET'])
@jwt_required()
def exportar_beneficiarios_excel():
    try:
        filtro = request.args.get('filtro', '')
        tipo_exportacion = request.args.get('tipo_exportacion', 'todos')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        current_app.logger.debug(f"Parámetros de exportación: filtro={filtro}, tipo_exportacion={tipo_exportacion}, fecha_inicio={fecha_inicio}, fecha_fin={fecha_fin}")

        beneficiarios = current_app.config['MONGO_DB']['beneficiarios']
        filtro_query = {}

        # Filtro por texto
        if filtro:
            filtro_query['$or'] = [
                {'nombre_completo': {'$regex': filtro, '$options': 'i'}},
                {'numero_documento': {'$regex': filtro, '$options': 'i'}},
                {'comuna': {'$regex': filtro, '$options': 'i'}},
                {'barrio': {'$regex': filtro, '$options': 'i'}}
            ]

        # Filtro por fecha si se seleccionó rango
        if tipo_exportacion == 'rango':
            if not fecha_inicio or not fecha_fin:
                current_app.logger.warning("Fechas de rango incompletas")
                return jsonify({'msg': 'Debe proporcionar fecha de inicio y fin'}), 400
            
            try:
                fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d")
                fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d")
                
                # Ajustar fechas para cubrir todo el día
                fecha_fin_dt = datetime.combine(fecha_fin_dt.date(), datetime.max.time())
                
                # Filtro compatible con ambos formatos: datetime y string
                filtro_query['$or'] = [
                    {'fecha_registro': {'$gte': fecha_inicio_dt, '$lte': fecha_fin_dt}},
                    {'fecha_registro': {'$gte': fecha_inicio, '$lte': fecha_fin}}  # para strings
                ]
                current_app.logger.debug(f"Rango de fechas: {fecha_inicio_dt} - {fecha_fin_dt} (y string)")
            except ValueError as e:
                current_app.logger.error(f"Error en formato de fecha: {e}")
                return jsonify({'msg': 'Formato de fecha inválido'}), 400

        # Obtener registros
        registros = list(beneficiarios.find(filtro_query))

        current_app.logger.info(f"Registros encontrados: {len(registros)}")

        if not registros:
            current_app.logger.warning("No hay registros para exportar en el rango especificado")
            # Cambiado de 404 a 204 (sin contenido) para evitar error en frontend y ser semánticamente correcto
            return ('', 204)

        # Preparar datos para el DataFrame
        datos_exportacion = []
        for r in registros:
            # Convertir fecha_registro a string con formato YYYY-MM-DD
            fecha_registro = r.get('fecha_registro', '')
            if isinstance(fecha_registro, datetime):
                fecha_registro = fecha_registro.strftime('%Y-%m-%d')
            elif isinstance(fecha_registro, str):
                # Si es string tipo ISO, recortar solo la fecha
                if 'T' in fecha_registro:
                    fecha_registro = fecha_registro.split('T')[0]
            else:
                fecha_registro = ''

            datos_exportacion.append({
                'Nombre Completo': r.get('nombre_completo', ''),
                'Tipo Documento': r.get('tipo_documento', ''),
                'Número Documento': r.get('numero_documento', ''),
                'Género': r.get('genero', ''),
                'Rango Edad': r.get('rango_edad', ''),
                'Correo Electrónico': r.get('correo_electronico', 'No registrado'),
                'Número Celular': r.get('numero_celular', 'No registrado'),
                'Comuna': r.get('comuna', ''),
                'Barrio': r.get('barrio', ''),
                'Línea Trabajo': r.get('linea_trabajo_nombre', 'No asignado'),
                'Fecha Registro': fecha_registro,
                'Estudia Actualmente': 'Sí' if r.get('estudia_actualmente') else 'No',
                'Nivel Educativo': r.get('nivel_educativo', ''),
                'Situación Laboral': r.get('situacion_laboral', ''),
                'Víctima Conflicto': 'Sí' if r.get('victima_conflicto') else 'No',
                'Tiene Discapacidad': 'Sí' if r.get('tiene_discapacidad') else 'No'
            })

        # Crear DataFrame
        df = pd.DataFrame(datos_exportacion)

        # Crear archivo Excel en memoria
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='Beneficiarios', index=False)

        output.seek(0)

        return send_file(
            output,
            as_attachment=True,
            download_name='Beneficiarios.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        current_app.logger.error(f"Error al exportar beneficiarios: {str(e)}")
        return jsonify({'msg': f'Error al exportar: {str(e)}'}), 500
