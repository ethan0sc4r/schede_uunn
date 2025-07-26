from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Image, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from PIL import Image as PILImage
import io
import os
from typing import Optional, Dict, Any

def create_naval_unit_pdf(
    unit_data: Dict[str, Any],
    output_path: str,
    group_override: Optional[Dict[str, Any]] = None
) -> str:
    """
    Create a PDF of a naval unit card with the specified A4 layout.
    
    Args:
        unit_data: Naval unit data including name, class, characteristics, image paths
        output_path: Path where the PDF will be saved
        group_override: Optional group data to override unit logo and flag
    
    Returns:
        Path to the generated PDF file
    """
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica-Bold',
        spaceAfter=3
    )
    
    content_style = ParagraphStyle(
        'Content',
        parent=styles['Normal'],
        fontSize=12,
        fontName='Helvetica'
    )
    
    # Story (content) list
    story = []
    
    # Header section with logo and unit info
    header_data = []
    
    # Left side - Logo and Class
    left_cell_content = []
    
    # Add logo if available
    logo_path = group_override.get('logo_path') if group_override else unit_data.get('logo_path')
    if logo_path and os.path.exists(logo_path):
        try:
            logo_img = Image(logo_path, width=40*mm, height=40*mm)
            left_cell_content.append(logo_img)
        except:
            pass
    
    left_cell_content.extend([
        Paragraph("CLASSE UNITA'", label_style),
        Paragraph(unit_data.get('unit_class', ''), content_style)
    ])
    
    # Right side - Unit Name
    right_cell_content = [
        Paragraph("NOME UNITA' NAVALE", label_style),
        Paragraph(unit_data.get('name', ''), title_style)
    ]
    
    header_table = Table(
        [[left_cell_content, right_cell_content]],
        colWidths=[80*mm, 90*mm]
    )
    
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    
    story.append(header_table)
    story.append(Spacer(1, 20*mm))
    
    # Central silhouette
    silhouette_path = unit_data.get('silhouette_path')
    if silhouette_path and os.path.exists(silhouette_path):
        try:
            # Calculate image dimensions while maintaining aspect ratio
            with PILImage.open(silhouette_path) as img:
                img_width, img_height = img.size
                aspect_ratio = img_width / img_height
                
                # Maximum dimensions for the silhouette area
                max_width = 150*mm
                max_height = 80*mm
                
                if aspect_ratio > max_width / max_height:
                    # Image is wider, fit to width
                    display_width = max_width
                    display_height = max_width / aspect_ratio
                else:
                    # Image is taller, fit to height
                    display_height = max_height
                    display_width = max_height * aspect_ratio
                
                # Apply zoom factor
                zoom = float(unit_data.get('silhouette_zoom', 1.0))
                display_width *= zoom
                display_height *= zoom
                
                silhouette_img = Image(
                    silhouette_path,
                    width=display_width,
                    height=display_height
                )
                
                # Center the image
                silhouette_table = Table(
                    [[silhouette_img]],
                    colWidths=[170*mm]
                )
                silhouette_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                    ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
                ]))
                
                story.append(silhouette_table)
        except Exception as e:
            # If image loading fails, add a placeholder
            story.append(Paragraph("Silhouette non disponibile", content_style))
    else:
        story.append(Paragraph("Silhouette non disponibile", content_style))
    
    story.append(Spacer(1, 15*mm))
    
    # Characteristics table
    if unit_data.get('characteristics'):
        char_data = [['CARATTERISTICA', 'VALORE']]
        
        for char in sorted(unit_data['characteristics'], key=lambda x: x.get('order_index', 0)):
            char_data.append([
                char.get('characteristic_name', ''),
                char.get('characteristic_value', '')
            ])
        
        char_table = Table(char_data, colWidths=[70*mm, 100*mm])
        char_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(char_table)
    
    # Footer with flag
    story.append(Spacer(1, 20*mm))
    
    flag_path = group_override.get('flag_path') if group_override else unit_data.get('flag_path')
    if flag_path and os.path.exists(flag_path):
        try:
            flag_img = Image(flag_path, width=30*mm, height=20*mm)
            flag_table = Table([[flag_img]], colWidths=[170*mm])
            flag_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'RIGHT'),
            ]))
            story.append(flag_table)
        except:
            pass
    
    # Build PDF
    doc.build(story)
    
    return output_path

def create_naval_unit_image(
    unit_data: Dict[str, Any],
    output_path: str,
    group_override: Optional[Dict[str, Any]] = None,
    format: str = "PNG"
) -> str:
    """
    Create an image (PNG/JPG) of a naval unit card.
    
    This is a simplified version that could be enhanced with PIL/Pillow
    for more sophisticated image composition.
    """
    
    # For now, this is a placeholder that would create a PDF first
    # and then convert it to an image using a library like pdf2image
    # or create the image directly using PIL/Pillow
    
    # Placeholder implementation
    if format.upper() not in ["PNG", "JPG", "JPEG"]:
        format = "PNG"
    
    # Create a basic image using PIL
    from PIL import Image, ImageDraw, ImageFont
    
    # Create a white background image (A4 proportions)
    img_width = 2480  # A4 width at 300 DPI
    img_height = 3508  # A4 height at 300 DPI
    
    image = PILImage.new('RGB', (img_width, img_height), 'white')
    draw = ImageDraw.Draw(image)
    
    try:
        # Try to use a system font
        title_font = ImageFont.truetype("arial.ttf", 60)
        subtitle_font = ImageFont.truetype("arial.ttf", 40)
        text_font = ImageFont.truetype("arial.ttf", 30)
    except:
        # Fallback to default font
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
    
    # Draw unit name
    unit_name = unit_data.get('name', 'Unknown Unit')
    draw.text((img_width//2, 200), unit_name, fill='black', font=title_font, anchor='mt')
    
    # Draw unit class
    unit_class = unit_data.get('unit_class', 'Unknown Class')
    draw.text((200, 400), f"CLASSE: {unit_class}", fill='black', font=subtitle_font)
    
    # Add characteristics
    y_offset = 600
    if unit_data.get('characteristics'):
        for char in unit_data['characteristics'][:10]:  # Limit to first 10 characteristics
            char_text = f"{char.get('characteristic_name', '')}: {char.get('characteristic_value', '')}"
            draw.text((200, y_offset), char_text, fill='black', font=text_font)
            y_offset += 100
    
    # Save the image
    image.save(output_path, format=format.upper())
    
    return output_path