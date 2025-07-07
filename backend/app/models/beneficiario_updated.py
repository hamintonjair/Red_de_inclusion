from datetime import datetime
from bson import ObjectId

# Importaciones de Marshmallow
from marshmallow import Schema, fields, validate, EXCLUDE
from marshmallow.validate import Length, OneOf, Regexp, Email, Range
from marshmallow.decorators import validates_schema
from marshmallow.exceptions import ValidationError
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date
import logging

# Constantes para validaciones
TIPOS_DOCUMENTO = ['Cédula de ciudadanía', 'Tarjeta de identidad', 'Cédula extranjera', 'Sin documento', 'Otro']
GENEROS = ['Masculino', 'Femenino', 'No binario', 'Prefiere no decirlo']
RANGOS_EDAD = ['0-5', '6-12', '13-17', '18-28', '29-59', '60+']
ETNIAS = ['Indígena', 'Afrodescendiente', 'Raizal', 'Palenquero', 'ROM', 'Mestizo', 'Ninguna']
TIPOS_DISCAPACIDAD = ['Visual', 'Auditiva', 'Motriz', 'Psicosocial', 'Cognitiva', 'Otra']
NIVELES_EDUCATIVOS = ['Ninguno', 'Primaria incompleta', 'Primaria completa', 'Secundaria incompleta', 'Secundaria completa', 'Técnica', 'Tecnológica', 'Universitaria', 'Posgrado']
SITUACIONES_LABORALES = ['Empleado', 'Independiente', 'Desempleado', 'Pensionado', 'Otro']
TIPOS_VIVIENDA = ['Propia', 'Arriendo', 'Familiar', 'Invasión', 'Otra']
TIPOS_VERIFICACION = ['huella_digital', 'firma_digital']
ESTADOS_VERIFICACION = ['pendiente', 'verificado', 'rechazado']

# Esquema obsoleto para compatibilidad con datos existentes
class HuellaDactilarSchema(Schema):
    id = fields.Str(required=False)
    type = fields.Str(required=False)
    quality = fields.Int(required=False)
    documento = fields.Str(required=False)
    nombre = fields.Str(required=False)
    fecha_registro = fields.Str(required=False)
    datos_biometricos = fields.Dict(required=False)
    codigo_verificacion = fields.Str(required=False)
    enlace_qr = fields.Str(required=False)

class VerificacionBiometricaSchema(Schema):
    credential_id = fields.Str(required=True)
    public_key = fields.Str(required=True)
    fecha_registro = fields.DateTime(required=True)
    tipo_verificacion = fields.Str(required=True, validate=validate.OneOf(TIPOS_VERIFICACION))
    estado = fields.Str(required=True, validate=validate.OneOf(ESTADOS_VERIFICACION))
    dispositivo = fields.Dict(keys=fields.Str(), values=fields.Str())
    metadata = fields.Dict(keys=fields.Str(), values=fields.Str())

class BeneficiarioSchema(Schema):
    funcionario_id = fields.Str(required=True)
    funcionario_nombre = fields.Str(required=True)
    linea_trabajo = fields.Str(required=True)
    fecha_registro = fields.Str(required=True)
    nombre_completo = fields.Str(required=True)
    tipo_documento = fields.Str(required=True)
    # Campo obsoleto, mantenido para compatibilidad
    huella_dactilar = fields.Nested(HuellaDactilarSchema, required=False, allow_none=True)
    # Campo para almacenar la firma digital en formato base64
    firma = fields.Str(required=False, allow_none=True)
    verificacion_biometrica = fields.Nested(VerificacionBiometricaSchema, required=False)
    codigo_verificacion = fields.Str(required=False)  # Código único para el QR
    numero_documento = fields.Str(required=True)
    genero = fields.Str(required=True)
    rango_edad = fields.Str(required=True)
    sabe_leer = fields.Bool(required=True)
    sabe_escribir = fields.Bool(required=True)
    numero_celular = fields.Str(required=True)
    correo_electronico = fields.Str()
    etnia = fields.Str()
    comuna = fields.Str(required=True)
    barrio = fields.Str(required=True)
    barrio_lat = fields.Float(required=False, allow_none=True)
    barrio_lng = fields.Float(required=False, allow_none=True)
    tiene_discapacidad = fields.Bool()
    tipo_discapacidad = fields.Str()
    tiene_certificado_discapacidad = fields.Bool(required=False)  # Nuevo campo
    nombre_cuidadora = fields.Str()
    labora_cuidadora = fields.Bool()
    victima_conflicto = fields.Bool()
    hijos_a_cargo = fields.Int()
    estudia_actualmente = fields.Bool()
    nivel_educativo = fields.Str()
    situacion_laboral = fields.Str()
    tipo_vivienda = fields.Str()
    ayuda_humanitaria = fields.Bool()
    descripcion_ayuda_humanitaria = fields.Str()

beneficiario_schema = BeneficiarioSchema()
beneficiarios_schema = BeneficiarioSchema(many=True)

# Resto del código de la clase BeneficiarioModel...
