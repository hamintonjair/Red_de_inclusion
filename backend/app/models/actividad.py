# backend/app/models/actividad.py
import logging
from datetime import datetime, timezone
from bson import ObjectId
from marshmallow import Schema, fields, validate, EXCLUDE, validates_schema, ValidationError

# Configurar logger
logger = logging.getLogger(__name__)

class AsistenciaSchema(Schema):
    class Meta:
        unknown = EXCLUDE
    
    # Campos comunes
    tipo = fields.Str(required=True, validate=validate.OneOf(['beneficiario', 'funcionario']))
    asistio = fields.Bool(default=False)
    observaciones = fields.Str(allow_none=True)
    
    # Campos para beneficiarios
    beneficiario_id = fields.Str(required=False, allow_none=True)
    
    # Campos para funcionarios
    nombre = fields.Str(required=False, allow_none=True)
    cedula = fields.Str(required=False, allow_none=True)
    dependencia = fields.Str(required=False, allow_none=True)
    cargo = fields.Str(required=False, allow_none=True)
    tipo_participacion = fields.Str(required=False, allow_none=True)
    telefono = fields.Str(required=False, allow_none=True)
    email = fields.Email(required=False, allow_none=True)
    firma = fields.Str(required=False, allow_none=True)
    
    # Validación personalizada
    @validates_schema
    def validate_fields(self, data, **kwargs):
        if data.get('tipo') == 'beneficiario' and not data.get('beneficiario_id'):
            raise ValidationError('El campo beneficiario_id es requerido para asistentes tipo beneficiario')
            
        if data.get('tipo') == 'funcionario':
            required_fields = ['nombre', 'cedula', 'dependencia', 'cargo', 'tipo_participacion']
            for field in required_fields:
                if not data.get(field):
                    raise ValidationError(f'El campo {field} es requerido para asistentes tipo funcionario')

class ActividadSchema(Schema):
    class Meta:
        unknown = EXCLUDE


    tema = fields.Str(required=True, validate=validate.Length(min=3, max=200))
    objetivo = fields.Str(required=True)
    lugar = fields.Str(required=True)
    dependencia = fields.Str(required=True)
    fecha = fields.DateTime(required=True)
    hora_inicio = fields.Str(required=True)
    hora_fin = fields.Str(required=True)
    linea_trabajo_id = fields.Str(required=True)
    asistentes = fields.List(fields.Nested(AsistenciaSchema), default=[])
    funcionario_id = fields.Str(required=True)
    estado = fields.Str(
        validate=validate.OneOf(['pendiente', 'en_progreso', 'completada', 'cancelada']),
        default='pendiente'
    )
    logo_url = fields.Str(allow_none=True)
    creado_por = fields.Str(required=True)
    actualizado_por = fields.Str(allow_none=True)
    fecha_creacion = fields.DateTime(default=datetime.utcnow)
    fecha_actualizacion = fields.DateTime(default=datetime.utcnow)

actividad_schema = ActividadSchema()
actividades_schema = ActividadSchema(many=True)

class ActividadModel:
    def __init__(self, db=None):
        """
        Inicializar modelo de Actividad
        
        :param db: Conexión a la base de datos MongoDB
        """
        if db is None:
            from flask import current_app
            db = current_app.config.get('db')
        
        if db is None:
            raise ValueError("Base de datos no configurada")
        
        self.db = db
        self.collection = db['actividades']
        self.schema = ActividadSchema()

    def crear_actividad(self, datos):
        """
        Crear una nueva actividad
        
        :param datos: Diccionario con datos de la actividad
        :return: ID de la nueva actividad
        """
        try:
            # Validar datos
            datos_validados = self.schema.load(datos)
            
            # Insertar en la base de datos
            resultado = self.collection.insert_one(datos_validados)
            return str(resultado.inserted_id)
            
        except Exception as e:
            raise ValueError(f"Error al crear la actividad: {str(e)}")

    def obtener_actividades(self, filtros=None):
        """
        Obtener actividades con filtros opcionales
        
        :param filtros: Diccionario de filtros para la consulta
        :return: Lista de actividades
        """
        try:
            if filtros is None:
                filtros = {}
                
            # Convertir string de fechas a objetos datetime si existen
            if 'fecha_inicio' in filtros and 'fecha_fin' in filtros:
                filtros['fecha'] = {
                    '$gte': datetime.fromisoformat(filtros.pop('fecha_inicio')),
                    '$lte': datetime.fromisoformat(filtros.pop('fecha_fin'))
                }
                
            # Convertir string IDs a ObjectId
            for key in ['linea_trabajo_id', 'funcionario_id', 'creado_por']:
                if key in filtros and filtros[key]:
                    try:
                        filtros[key] = ObjectId(filtros[key])
                    except:
                        # Si no es un ObjectId válido, lo dejamos como está
                        pass
            
            # Ordenar por defecto por fecha descendente
            sort_field = 'fecha'
            sort_direction = -1
            
            if 'orden_por' in filtros:
                sort_field = filtros.pop('orden_por')
                sort_direction = 1 if filtros.pop('orden_direccion', 'asc') == 'asc' else -1
            
            actividades = list(self.collection.find(filtros).sort(sort_field, sort_direction))
            
            # Convertir ObjectId a string
            for actividad in actividades:
                actividad['_id'] = str(actividad['_id'])
                
            return actividades
            
        except Exception as e:
            logger.error(f"Error en obtener_actividades: {str(e)}", exc_info=True)
            raise ValueError(f"Error al obtener actividades: {str(e)}")
            
    def obtener_actividades_paginadas(self, pagina=1, por_pagina=10, busqueda='', orden_por='fecha', orden_direccion='desc', **filtros):
        """
        Obtener actividades con paginación y búsqueda
        
        :param pagina: Número de página (1-based)
        :param por_pagina: Cantidad de registros por página
        :param busqueda: Término de búsqueda
        :param orden_por: Campo por el que ordenar
        :param orden_direccion: Dirección de ordenación (asc/desc)
        :param filtros: Filtros adicionales
        :return: Diccionario con actividades y metadatos de paginación
        """
        try:
            # Construir consulta de búsqueda
            query = {}
            
            # Aplicar búsqueda si se proporciona
            if busqueda:
                query['$or'] = [
                    {'tema': {'$regex': busqueda, '$options': 'i'}},
                    {'lugar': {'$regex': busqueda, '$options': 'i'}},
                    {'dependencia': {'$regex': busqueda, '$options': 'i'}},
                    {'objetivo': {'$regex': busqueda, '$options': 'i'}}
                ]
            
            # Aplicar filtros adicionales
            for key, value in filtros.items():
                if value is not None and value != '':
                    query[key] = value
            
            # Contar total de documentos
            total = self.collection.count_documents(query)
            
            # Calcular total de páginas
            total_paginas = (total + por_pagina - 1) // por_pagina
            
            # Asegurar que la página esté dentro del rango válido
            pagina = max(1, min(pagina, max(1, total_paginas)))
            
            # Calcular salto
            skip = (pagina - 1) * por_pagina
            
            # Ordenar
            sort_direction = 1 if orden_direccion == 'asc' else -1
            sort_field = [(orden_por, sort_direction)]
            
            # Si ordenamos por un campo que no es _id, añadimos _id como criterio de desempate
            if orden_por != '_id':
                sort_field.append(('_id', sort_direction))
            
            # Obtener actividades paginadas
            actividades_cursor = self.collection.find(query).sort(sort_field).skip(skip).limit(por_pagina)
            actividades = list(actividades_cursor)
            
            # Convertir ObjectId a string y formatear fechas
            for actividad in actividades:
                actividad['_id'] = str(actividad['_id'])
                if 'fecha' in actividad and isinstance(actividad['fecha'], datetime):
                    actividad['fecha'] = actividad['fecha'].isoformat()
                if 'fecha_creacion' in actividad and isinstance(actividad['fecha_creacion'], datetime):
                    actividad['fecha_creacion'] = actividad['fecha_creacion'].isoformat()
                if 'fecha_actualizacion' in actividad and isinstance(actividad['fecha_actualizacion'], datetime):
                    actividad['fecha_actualizacion'] = actividad['fecha_actualizacion'].isoformat()
            
            return {
                'actividades': actividades,
                'total': total,
                'pagina': pagina,
                'por_pagina': por_pagina,
                'total_paginas': total_paginas or 1
            }
            
        except Exception as e:
            logger.error(f"Error en obtener_actividades_paginadas: {str(e)}", exc_info=True)
            raise ValueError(f"Error al obtener actividades paginadas: {str(e)}")

    def obtener_actividad_por_id(self, actividad_id):
        """
        Obtener una actividad por su ID
        
        :param actividad_id: ID de la actividad
        :return: Datos de la actividad con las fechas formateadas correctamente
        """
        try:
            actividad = self.collection.find_one({'_id': ObjectId(actividad_id)})
            if actividad:
                # Convertir ObjectId a string
                actividad['_id'] = str(actividad['_id'])
                
                # Asegurarse de que las fechas estén en formato ISO
                date_fields = ['fecha', 'fecha_creacion', 'fecha_actualizacion']
                for field in date_fields:
                    if field in actividad and actividad[field] is not None:
                        if isinstance(actividad[field], datetime):
                            # Si es un objeto datetime, convertirlo a string ISO
                            actividad[field] = actividad[field].isoformat()
                        elif isinstance(actividad[field], str):
                            # Si ya es un string, asegurarse de que esté en formato ISO
                            try:
                                # Intentar convertir a datetime y luego a ISO
                                dt = datetime.fromisoformat(actividad[field].replace('Z', '+00:00'))
                                actividad[field] = dt.isoformat()
                            except (ValueError, TypeError):
                                # Si falla, dejar el valor como está
                                pass
            return actividad
        except Exception as e:
            logger.error(f"Error al obtener la actividad {actividad_id}: {str(e)}", exc_info=True)
            raise ValueError(f"Error al obtener la actividad: {str(e)}")

    def actualizar_actividad(self, actividad_id, datos):
        """
        Actualizar una actividad
        
        :param actividad_id: ID de la actividad a actualizar
        :param datos: Diccionario con datos a actualizar
        :return: Número de documentos modificados
        """
        try:
            # Hacer una copia de los datos para no modificar el original
            datos_actualizados = datos.copy()
            
            # Actualizar campos de auditoría
            datos_actualizados['fecha_actualizacion'] = datetime.utcnow()
            
            # Si no se proporciona actualizado_por, usar 'sistema' como valor por defecto
            if 'actualizado_por' not in datos_actualizados:
                datos_actualizados['actualizado_por'] = 'sistema'
            
            # Preparar el objeto de actualización
            update_data = {}
            
            # Mapear los campos al formato correcto según el esquema
            for field in self.schema.declared_fields:
                if field in datos_actualizados:
                    # Si el campo es una fecha, asegurarse de que esté en el formato correcto
                    if field in ['fecha', 'fecha_creacion', 'fecha_actualizacion'] and datos_actualizados[field]:
                        try:
                            valor = datos_actualizados[field]
                            if isinstance(valor, str):
                                # Manejar diferentes formatos de fecha
                                try:
                                    # Intentar con formato ISO
                                    fecha = datetime.fromisoformat(valor.replace('Z', '+00:00'))
                                except ValueError:
                                    # Intentar con formato YYYY-MM-DD
                                    fecha = datetime.strptime(valor, '%Y-%m-%d')
                                
                                # Asegurarse de que la fecha esté en UTC
                                if fecha.tzinfo is None:
                                    fecha = fecha.replace(tzinfo=timezone.utc)
                                update_data[field] = fecha
                            elif isinstance(valor, datetime):
                                # Si ya es un objeto datetime, asegurarse de que tenga timezone
                                if valor.tzinfo is None:
                                    valor = valor.replace(tzinfo=timezone.utc)
                                update_data[field] = valor
                        except (ValueError, TypeError) as e:
                            logger.error(f"Error al convertir fecha para el campo {field}: {str(e)}")
                            # Si falla la conversión, mantener el valor original
                            update_data[field] = valor
                    else:
                        update_data[field] = datos_actualizados[field]
            
            logger.info(f"Actualizando actividad {actividad_id} con datos: {update_data}")
            
            # Actualizar en la base de datos
            resultado = self.collection.update_one(
                {'_id': ObjectId(actividad_id)},
                {'$set': update_data}
            )
            
            logger.info(f"Documentos modificados: {resultado.modified_count}")
            return resultado.modified_count
            
        except Exception as e:
            logger.error(f"Error en actualizar_actividad: {str(e)}", exc_info=True)
            raise ValueError(f"Error al actualizar la actividad: {str(e)}")

    def eliminar_actividad(self, actividad_id):
        """
        Eliminar una actividad
        
        :param actividad_id: ID de la actividad a eliminar
        :return: Número de documentos eliminados
        """
        try:
            resultado = self.collection.delete_one({'_id': ObjectId(actividad_id)})
            return resultado.deleted_count
        except Exception as e:
            raise ValueError(f"Error al eliminar la actividad: {str(e)}")

    def registrar_asistencias(self, actividad_id, asistentes):
        """
        Registrar asistentes a una actividad
        
        :param actividad_id: ID de la actividad
        :param asistentes: Lista de asistentes
        :return: Número de documentos modificados
        """
        try:
            # Validar estructura de asistentes
            for asistente in asistentes:
                if 'beneficiario_id' not in asistente:
                    raise ValueError("Cada asistente debe tener un beneficiario_id")
            
            # Actualizar asistentes en la actividad
            resultado = self.collection.update_one(
                {'_id': ObjectId(actividad_id)},
                {
                    '$set': {
                        'asistentes': asistentes,
                        'fecha_actualizacion': datetime.utcnow(),
                        'estado': 'completada'
                    }
                }
            )
            
            return resultado.modified_count
            
        except Exception as e:
            raise ValueError(f"Error al registrar asistencias: {str(e)}")
            
    def guardar_asistentes(self, actividad_id, asistentes, usuario_id):
        """
        Guarda o actualiza los asistentes de una actividad
        
        :param actividad_id: ID de la actividad
        :param asistentes: Lista de diccionarios con datos de asistentes
        :param usuario_id: ID del usuario que realiza la acción
        :return: Número de asistentes guardados
        """
        try:
            # Validar que la actividad exista
            actividad = self.obtener_actividad_por_id(actividad_id)
            if not actividad:
                raise ValueError("Actividad no encontrada")
            
            # Validar los datos de los asistentes
            asistencia_schema = AsistenciaSchema()
            asistentes_validados = []
            
            for asistente in asistentes:
                try:
                    # Validar cada asistente
                    asistente_validado = asistencia_schema.load(asistente)
                    asistentes_validados.append(asistente_validado)
                except ValidationError as e:
                    logger.error(f"Error al validar asistente: {str(e)}")
                    raise ValueError(f"Datos de asistente no válidos: {str(e)}")
            
            # Actualizar la actividad con los nuevos asistentes
            resultado = self.collection.update_one(
                {'_id': ObjectId(actividad_id)},
                {
                    '$set': {
                        'asistentes': asistentes_validados,
                        'actualizado_por': usuario_id,
                        'fecha_actualizacion': datetime.utcnow()
                    }
                }
            )
            
            if resultado.matched_count == 0:
                raise ValueError("No se pudo actualizar la actividad")
                
            return len(asistentes_validados)
            
        except Exception as e:
            logger.error(f"Error al guardar asistentes: {str(e)}")
            raise