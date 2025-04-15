from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..models.funcionario import FuncionarioModel
from ..schemas.funcionario_schema import funcionario_schema
import logging
import bcrypt
from datetime import datetime
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

def init_admin_user(mongo_db):
    """Crear usuario administrador si no existe"""
    funcionarios = mongo_db['funcionarios']
    admin_email = 'admin@redinclusion.com'
    
    # Verificar si ya existe un admin
    existing_admin = funcionarios.find_one({'email': admin_email})
    if not existing_admin:
        # Crear usuario administrador
        admin_data = {
            'nombre': 'Administrador',
            'secretaría': 'Administración General',
            'email': admin_email,
            'password_hash': bcrypt.hashpw('RedInclusion2024'.encode('utf-8'), bcrypt.gensalt()),
            'linea_trabajo': str(ObjectId()),  # Generar un ObjectId para línea de trabajo
            'rol': 'admin',
            'estado': 'Activo',
            'fecha_registro': datetime.utcnow()
        }
        
        funcionarios.insert_one(admin_data)
        logging.info("Usuario administrador creado exitosamente")
    else:
        logging.info("Usuario administrador ya existe")

def verify_password(stored_password, provided_password):
    """
    Verificar contraseña usando bcrypt
    
    :param stored_password: Hash de contraseña almacenado
    :param provided_password: Contraseña proporcionada por el usuario
    :return: Booleano indicando si la contraseña es correcta
    """
    try:
        # Si stored_password es un hash de bcrypt
        if isinstance(stored_password, bytes):
            return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password)
        
        # Si stored_password es un string (para compatibilidad)
        elif isinstance(stored_password, str):
            # Convertir a bytes si es un string
            stored_bytes = stored_password.encode('utf-8')
            return bcrypt.checkpw(provided_password.encode('utf-8'), stored_bytes)
        
        # Si no es un formato reconocido
        return False

    except Exception as e:
        current_app.logger.error(f"Error en verificación de contraseña: {e}")
        return False

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"msg": "Credenciales incompletas"}), 400

        # Obtener datos de la base de datos
        db = current_app.config['db']
        funcionario_model = FuncionarioModel(db)
        
        # Buscar funcionario por email
        funcionario_completo = funcionario_model.obtener_funcionario_por_email(email)

        if not funcionario_completo:
            return jsonify({"msg": "Usuario no encontrado"}), 404

        # Verificar contraseña
        password_verified = verify_password(funcionario_completo.get('password_hash', b''), password)
        
        if not password_verified:
            return jsonify({"msg": "Contraseña incorrecta"}), 401

        # Obtener nombre de línea de trabajo
        lineas_trabajo = db['lineas_trabajo']
        linea_trabajo_obj = lineas_trabajo.find_one({'_id': ObjectId(funcionario_completo['linea_trabajo'])})
        nombre_linea_trabajo = linea_trabajo_obj['nombre'] if linea_trabajo_obj else 'Sin línea de trabajo'

        # Crear token de acceso
        access_token = create_access_token(identity=funcionario_completo['id'])

        # Preparar respuesta
        return jsonify({
            "access_token": access_token,
            "status": "success",
            "funcionario": {
                "id": funcionario_completo['id'],
                "nombre": funcionario_completo['nombre'],
                "secretaría": funcionario_completo.get('secretaría', ''),
                "email": funcionario_completo['email'],
                "linea_trabajo": nombre_linea_trabajo,
                "linea_trabajo_id": funcionario_completo['linea_trabajo'],
                "linea_trabajo_nombre": funcionario_completo.get('nombreLineaTrabajo', nombre_linea_trabajo),
                "rol": funcionario_completo.get('rol', 'funcionario'),
                "estado": funcionario_completo.get('estado', 'Activo')
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error en login: {str(e)}")
        return jsonify({"msg": "Error interno del servidor"}), 500

@auth_bp.route('/perfil', methods=['GET'])
@jwt_required()
def obtener_perfil():
    """
    Obtener perfil del funcionario autenticado
    """
    try:
        # Obtener ID del funcionario desde el token
        funcionario_id = get_jwt_identity()
        
        # Obtener datos de la base de datos
        db = current_app.config['db']
        funcionario_model = FuncionarioModel(db)
        
        # Buscar funcionario por ID
        funcionario = funcionario_model.obtener_funcionario_por_id(funcionario_id)
        
        if not funcionario:
            return jsonify({
                "msg": "Funcionario no encontrado", 
                "status": "error"
            }), 404
        
        return jsonify({
            "status": "success",
            "funcionario": {
                "id": funcionario['_id'],
                "nombre": funcionario['nombre'],
                "secretaría": funcionario.get('secretaría', ''),
                "email": funcionario['email'],
                "linea_trabajo": funcionario.get('linea_trabajo', ''),
                "rol": funcionario.get('rol', 'funcionario'),
                "estado": funcionario.get('estado', 'Activo'),
                "fecha_registro": funcionario.get('fecha_registro', '').isoformat() if funcionario.get('fecha_registro') else ''
            }
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Error al obtener perfil: {str(e)}")
        return jsonify({
            "msg": "Error interno del servidor", 
            "status": "error"
        }), 500

@auth_bp.route('/registro', methods=['POST'])
def registro():
    """
    Registrar un nuevo funcionario
    """
    try:
        data = request.get_json()
        
        # Validar datos
        datos_validados = funcionario_schema.load(data)
        
        # Obtener datos de la base de datos
        db = current_app.config['db']
        funcionario_model = FuncionarioModel(db)
        
        # Verificar si el usuario ya existe
        if funcionario_model.obtener_funcionario_por_email(data['email']):
            return jsonify({"msg": "El usuario ya existe"}), 409
        
        # Hashear contraseña
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        # Preparar datos de usuario
        user_data = {
            'nombre': data['nombre'],
            'email': data['email'],
            'password': hashed_password,
            'secretaría': data.get('secretaría', ''),
            'linea_trabajo': data.get('linea_trabajo', None),
            'rol': data.get('rol', 'funcionario'),
            'estado': data.get('estado', 'Activo'),
            'fecha_registro': datetime.utcnow()
        }
        
        # Crear funcionario
        nuevo_funcionario_id = funcionario_model.crear_funcionario(user_data)
        
        return jsonify({
            "msg": "Funcionario registrado exitosamente", 
            "funcionario_id": nuevo_funcionario_id
        }), 201
    
    except Exception as e:
        current_app.logger.error(f"Error en registro: {e}")
        return jsonify({"msg": f"Error en registro: {str(e)}"}), 500
