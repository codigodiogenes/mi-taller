from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud, schemas, database, email_utils, models
import os

router = APIRouter(
    prefix="/repairs",
    tags=["repairs"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Repair)
def create_repair(repair: schemas.RepairCreate, db: Session = Depends(database.get_db)):
    return crud.create_repair(db=db, repair=repair)

@router.get("/", response_model=List[schemas.Repair])
def read_repairs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_repairs(db, skip=skip, limit=limit)

@router.get("/by-client/{client_id}", response_model=List[schemas.Repair])
def read_repairs_by_client(client_id: int, db: Session = Depends(database.get_db)):
    return crud.get_repairs_by_client(db, client_id=client_id)

@router.get("/by-motorcycle/{motorcycle_id}", response_model=List[schemas.Repair])
def read_repairs_by_motorcycle(motorcycle_id: int, db: Session = Depends(database.get_db)):
    return crud.get_repairs_by_motorcycle(db, motorcycle_id=motorcycle_id)

@router.get("/{repair_id}", response_model=schemas.Repair)
def read_repair(repair_id: int, db: Session = Depends(database.get_db)):
    db_repair = crud.get_repair(db, repair_id=repair_id)
    if db_repair is None:
        raise HTTPException(status_code=404, detail="Repair not found")
    return db_repair

@router.put("/{repair_id}", response_model=schemas.Repair)
def update_repair(repair_id: int, repair_update: schemas.RepairUpdate, db: Session = Depends(database.get_db)):
    db_repair = crud.update_repair(db, repair_id=repair_id, repair_update=repair_update)
    if db_repair is None:
        raise HTTPException(status_code=404, detail="Repair not found")
    return db_repair

@router.post("/{repair_id}/items", response_model=schemas.RepairItem)
def create_repair_item(repair_id: int, item: schemas.RepairItemCreate, db: Session = Depends(database.get_db)):
    start_repair = crud.get_repair(db, repair_id=repair_id)
    if not start_repair:
        raise HTTPException(status_code=404, detail="Repair not found")
    return crud.create_repair_item(db=db, repair_id=repair_id, item=item)

@router.delete("/{repair_id}/items/{item_id}", response_model=schemas.RepairItem)
def delete_repair_item(repair_id: int, item_id: int, db: Session = Depends(database.get_db)):
    db_item = crud.delete_repair_item(db, repair_id=repair_id, item_id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.put("/{repair_id}/items/{item_id}", response_model=schemas.RepairItem)
def update_repair_item(repair_id: int, item_id: int, item: schemas.RepairItemUpdate, db: Session = Depends(database.get_db)):
    db_item = crud.update_repair_item(db=db, repair_id=repair_id, item_id=item_id, item_update=item)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.post("/{repair_id}/send-invoice")
def send_repair_invoice(repair_id: int, request: schemas.EmailRequest, db: Session = Depends(database.get_db)):
    db_repair = crud.get_repair(db, repair_id=repair_id)
    if not db_repair:
        raise HTTPException(status_code=404, detail="Repair not found")
    
    # Get client email (for reference/info, though we use request.emails)
    client = None
    if db_repair.motorcycle:
        client = db_repair.motorcycle.owner
    elif db_repair.client:
        client = db_repair.client
    
    if not request.emails:
        raise HTTPException(status_code=400, detail="No se han proporcionado destinatarios.")

    # Get workshop settings
    settings = {s.key: s.value for s in db.query(models.Setting).all()}
    workshop_name = settings.get('workshop_name', 'Taller de Motos')
    
    try:
        # Build Items rows for both Email and PDF
        items_rows_html = ""
        for item in db_repair.items:
            items_rows_html += f"""
            <tr>
                <td style='padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: left; font-size: 11px;'>{item.description}</td>
                <td style='padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 11px;'>{item.quantity}</td>
                <td style='padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-size: 11px;'>&#8364;{item.cost:.2f}</td>
                <td style='padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; font-size: 11px;'>&#8364;{(item.cost * item.quantity):.2f}</td>
            </tr>
            """

        workshop_address = settings.get('workshop_address', '')
        workshop_phone = settings.get('workshop_phone', '')
        workshop_email = settings.get('workshop_email', '')
        logo_url = settings.get('logo_url', '')

        # Resolve logo path
        logo_path = ""
        if logo_url:
            # logo_url is usually /uploads/settings/filename.ext
            # Backend dir is the root for uploads
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            # If running in portable mode, we might need to adjust
            potential_path = os.path.join(backend_dir, logo_url.lstrip('/'))
            if os.path.exists(potential_path):
                logo_path = potential_path
            else:
                # Try relative to CWD (for portable apps sometimes)
                potential_path = os.path.join(os.getcwd(), logo_url.lstrip('/'))
                if os.path.exists(potential_path):
                    logo_path = potential_path

        logo_html = ""
        if logo_path:
            logo_html = f'<img src="{logo_path}" style="height: 60px; margin-bottom: 10px;">'
        else:
            logo_html = f'<h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #1e293b;">{workshop_name}</h1>'

        client_info_html = ""
        if client:
            client_info_html = f"""
            <div style='margin-bottom: 5px;'>
                <p style='margin: 0; font-weight: bold; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;'>Cliente</p>
                <p style='margin: 8px 0 2px 0; font-size: 16px; font-weight: bold; color: #1e293b;'>{client.name}</p>
                <p style='margin: 2px 0; color: #64748b; font-size: 11px;'>{client.phone or ""}</p>
                <p style='margin: 2px 0; color: #64748b; font-size: 11px;'>{client.email or ""}</p>
                <p style='margin: 2px 0; color: #64748b; font-size: 11px;'>{client.address or ""}</p>
            </div>
            """

        moto_info_html = ""
        if db_repair.motorcycle:
            moto_info_html = f"""
            <div style='text-align: right;'>
                <p style='margin: 0; font-weight: bold; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;'>Vehículo</p>
                <p style='margin: 8px 0 2px 0; font-size: 14px; font-weight: bold; color: #1e293b;'>{db_repair.motorcycle.brand} {db_repair.motorcycle.model}</p>
                <p style='margin: 2px 0; font-weight: bold; color: #2563eb; font-size: 13px;'>{db_repair.motorcycle.plate.upper()}</p>
            </div>
            """
        else:
            moto_info_html = "<div style='text-align: right; color: #94a3b8; font-style: italic; font-size: 11px;'>Venta Directa</div>"

        # --- HTML BASE (Common for Email body and PDF) ---
        full_invoice_html = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                @page {{ 
                    size: a4; 
                    margin: 1.5cm; 
                }}
                body {{ font-family: Helvetica, Arial, sans-serif; color: #334155; line-height: 1.5; }}
                .workshop-info {{ color: #64748b; font-size: 10px; margin-top: 5px; }}
                .section-title {{ font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }}
                .description-box {{ background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #f1f5f9; }}
                .items-table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
                .items-table th {{ background: #f8fafc; padding: 12px 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #f1f5f9; }}
                .total-label {{ font-size: 14px; font-weight: bold; color: #64748b; text-transform: uppercase; }}
                .total-value {{ font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }}
            </style>
        </head>
        <body>
            <table style="width: 100%; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px;">
                <tr>
                    <td style="width: 50%; vertical-align: middle;">
                        {logo_html}
                        <div class="workshop-info">
                            {f"<p style='margin: 2px 0;'>{workshop_address}</p>" if workshop_address else ""}
                            {f"<p style='margin: 2px 0;'>Tel: {workshop_phone}</p>" if workshop_phone else ""}
                            {f"<p style='margin: 2px 0;'>{workshop_email}</p>" if workshop_email else ""}
                        </div>
                    </td>
                    <td style="width: 50%; text-align: right; vertical-align: top;">
                        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #f1f5f9;"># {db_repair.id:06d}</p>
                    </td>
                </tr>
            </table>

            <table style="width: 100%; margin-bottom: 30px;">
                <tr>
                    <td style="width: 60%; vertical-align: top;">
                        {client_info_html}
                    </td>
                    <td style="width: 40%; vertical-align: top; text-align: right;">
                        <p style="margin: 0; font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Detalles de Orden</p>
                        <p style="margin: 8px 0 2px 0; font-size: 12px; color: #1e293b;"><strong>Estado:</strong> <span style="color: {'#10b981' if db_repair.paid else '#ef4444'};">{'PAGADO' if db_repair.paid else 'PENDIENTE'}</span></p>
                        <p style="margin: 2px 0; font-size: 12px; color: #1e293b;"><strong>Fecha Emisión:</strong> {db_repair.entry_date.strftime('%d/%m/%Y')}</p>
                        <div style="margin-top: 20px;">
                            {moto_info_html}
                        </div>
                    </td>
                </tr>
            </table>

            <div class="section-title">Descripción de la Intervención</div>
            <div class="description-box">
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f172a;">{db_repair.description}</p>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50%;">Concepto / Piezas y Servicios</th>
                        <th style="text-align: center; width: 10%;">Cant.</th>
                        <th style="text-align: right; width: 20%;">P. Unitario</th>
                        <th style="text-align: right; width: 20%;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {items_rows_html}
                </tbody>
            </table>

            <table style="width: 100%; margin-top: 10px;">
                <tr>
                    <td style="width: 50%; vertical-align: bottom; font-size: 9px; color: #94a3b8; padding-bottom: 10px;">
                        Gracias por confiar en {workshop_name}.
                    </td>
                    <td style="width: 50%; text-align: right; border-top: 2px solid #0f172a; padding-top: 15px;">
                        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Base Imponible</span><br/>
                        <span style="font-size: 14px; font-weight: bold; color: #64748b;">&#8364;{db_repair.total_cost:.2f}</span><br/><br/>
                        
                        <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">I.V.A (21%)</span><br/>
                        <span style="font-size: 14px; font-weight: bold; color: #64748b;">&#8364;{(db_repair.total_cost * 0.21):.2f}</span><br/><br/>

                        <span class="total-label">Total Factura</span><br/>
                        <span class="total-value">&#8364;{(db_repair.total_cost * 1.21):.2f}</span>
                        <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: bold; color: {'#059669' if db_repair.paid else '#dc2626'}; text-transform: uppercase;">
                            { "RECIBO LIQUIDADO" if db_repair.paid else "PAGO PENDIENTE" }
                        </p>
                    </td>
                </tr>
            </table>

            <div style="margin-top: 80px; text-align: center; color: #cbd5e1; font-size: 10px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                Factura Digital Generada por MotosWorkshop Portable - Documento no contractual.
            </div>
        </body>
        </html>
        """

        # --- GENERAR PDF ---
        import io
        from xhtml2pdf import pisa
        pdf_buffer = io.BytesIO()
        
        # Helper to resolve local paths for xhtml2pdf
        def link_callback(uri, rel):
            if uri.startswith('/'): uri = uri[1:]
            # Try to resolve uri in backend uploads or static folders
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            p1 = os.path.join(backend_dir, uri)
            if os.path.exists(p1): return p1
            # Try relative to CWD
            p2 = os.path.join(os.getcwd(), uri)
            if os.path.exists(p2): return p2
            return uri

        pisa_status = pisa.CreatePDF(full_invoice_html, dest=pdf_buffer, encoding='utf-8', link_callback=link_callback)
        pdf_data = pdf_buffer.getvalue() if not pisa_status.err else None

        # --- ENVIAR EMAILS ---
        results = []
        attachment_name = f"Factura_{db_repair.id:06d}.pdf"

        html_content = full_invoice_html

        for email in request.emails:
            success, msg = email_utils.send_invoice_email(
                db, 
                email.strip(), 
                f"Factura {workshop_name} - Orden #{db_repair.id:06d}", 
                html_content,
                attachment_data=pdf_data,
                attachment_name=attachment_name
            )
            results.append({"email": email, "success": success, "message": msg})
        
        if not any(r["success"] for r in results):
            errors = [r["message"] for r in results]
            unique_errors = list(set(errors))
            raise HTTPException(
                status_code=500, 
                detail=f"Error al enviar email: {', '.join(unique_errors)}"
            )
            
        return {"status": "success", "message": "Email enviado con factura en PDF.", "results": results}

    except Exception as e:
        import traceback
        error_log = traceback.format_exc()
        print(error_log)
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

@router.delete("/{repair_id}")
def delete_repair(repair_id: int, db: Session = Depends(database.get_db)):
    db_repair = crud.delete_repair(db, repair_id=repair_id)
    if not db_repair:
        raise HTTPException(status_code=404, detail="Repair not found")
    return {"status": "success", "message": "Repair deleted"}
