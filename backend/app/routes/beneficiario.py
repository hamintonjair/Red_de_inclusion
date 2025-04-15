from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from app.models.beneficiario import BeneficiarioModel
import logging

beneficiario_bp = Blueprint('beneficiario', __name__)

@beneficiario_bp.route('/estadisticas/<linea_trabajo_id>', methods=['GET'])
@jwt_required()
def obtener_estadisticas_beneficiarios(linea_trabajo_id):
    """
    Obtener estadísticas de beneficiarios por línea de trabajo
    """
    try:
        current_app.logger.info(f"Solicitando estadísticas para línea de trabajo: {linea_trabajo_id}")
        
        db = current_app.config['db']
        beneficiario_model = BeneficiarioModel(db)
        
        # Convertir a ObjectId
        linea_trabajo_obj_id = ObjectId(linea_trabajo_id)
        
        # Verificar si la línea de trabajo existe
        linea_trabajo = db['lineas_trabajo'].find_one({'_id': linea_trabajo_obj_id})
        if not linea_trabajo:
            current_app.logger.warning(f"Línea de trabajo no encontrada: {linea_trabajo_id}")
            return jsonify({
                "status": "error",
                "msg": f"Línea de trabajo {linea_trabajo_id} no encontrada"
            }), 404
        
        # Obtener estadísticas
        estadisticas = beneficiario_model.obtener_estadisticas_por_linea_trabajo(linea_trabajo_obj_id)
        
        current_app.logger.info(f"Estadísticas obtenidas: {estadisticas}")
        return jsonify({
            "status": "success",
            "estadisticas": estadisticas
        }), 200
    
    except ValueError as ve:
        current_app.logger.error(f"Error de validación: {str(ve)}")
        return jsonify({
            "status": "error",
            "msg": str(ve)
        }), 400
    
    except Exception as e:
        current_app.logger.error(f"Error al obtener estadísticas de beneficiarios: {str(e)}")
        return jsonify({
            "status": "error",
            "msg": "Error al obtener estadísticas de beneficiarios"
        }), 500

@beneficiario_bp.route('/estadisticas', methods=['GET'])
@jwt_required()
def obtener_estadisticas_beneficiarios_todos():
    try:
        db = current_app.config['db']
        beneficiario_model = BeneficiarioModel(db)
        estadisticas = beneficiario_model.obtener_estadisticas_globales_admin()

        return jsonify({
            "status": "success",
            "estadisticas": estadisticas
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "msg": "Error al obtener estadísticas generales de beneficiarios"
        }), 500
