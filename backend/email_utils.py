import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
import models

def get_smtp_settings(db: Session):
    settings = db.query(models.Setting).all()
    settings_dict = {s.key: s.value for s in settings}
    return settings_dict

def send_invoice_email(db: Session, to_email: str, subject: str, html_content: str, attachment_data: bytes = None, attachment_name: str = "factura.pdf"):
    settings = get_smtp_settings(db)
    
    if settings.get('smtp_enabled') != 'true':
        return False, "El envío de emails no está habilitado en los ajustes."

    smtp_host = settings.get('smtp_host')
    smtp_port = int(settings.get('smtp_port', 587))
    smtp_user = settings.get('smtp_user')
    smtp_password = settings.get('smtp_password')
    smtp_from_name = settings.get('smtp_from_name', 'Taller de Motos')

    if not all([smtp_host, smtp_port, smtp_user, smtp_password]):
        return False, "Falta configuración SMTP (host, puerto, usuario o contraseña)."

    try:
        msg = MIMEMultipart()
        msg['From'] = f"{smtp_from_name} <{smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        # Cuerpo del mensaje
        msg.attach(MIMEText(html_content, 'html'))

        # Adjunto PDF si existe
        if attachment_data:
            from email.mime.application import MIMEApplication
            part = MIMEApplication(attachment_data)
            part.add_header('Content-Disposition', 'attachment', filename=attachment_name)
            msg.attach(part)

        # Standard SMTP connection
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()

        return True, "Email enviado correctamente."
    except Exception as e:
        return False, f"Error al enviar email: {str(e)}"
