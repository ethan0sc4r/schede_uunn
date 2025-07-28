from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from PIL import Image as PILImage
import os
import io
import base64
import requests
import tempfile
from typing import List, Dict, Any, Optional

def create_unit_powerpoint(unit_data: Dict[str, Any], output_path: str, template_config: Optional[Dict[str, Any]] = None) -> str:
    """
    Create a PowerPoint presentation from a single naval unit
    
    Args:
        unit_data: Unit data including layout config
        output_path: Path where to save the PowerPoint file
        template_config: Optional template configuration for presentation format
    
    Returns:
        Path to the created PowerPoint file
    """
    
    try:
        print(f"Creating PowerPoint for unit: {unit_data.get('name', 'Unknown')}")
        
        # Create new presentation
        prs = Presentation()
        
        # Apply template configuration if provided
        if template_config:
            canvas_width = template_config.get('canvasWidth', 1123)
            canvas_height = template_config.get('canvasHeight', 794)
            
            # Convert canvas dimensions to PowerPoint slide dimensions
            # Assuming 96 DPI for canvas and converting to inches
            slide_width_inches = canvas_width / 96.0
            slide_height_inches = canvas_height / 96.0
            
            prs.slide_width = Inches(slide_width_inches)
            prs.slide_height = Inches(slide_height_inches)
            
            print(f"Applied template dimensions: {slide_width_inches:.2f}\" x {slide_height_inches:.2f}\"")
        else:
            # Default to 16:9 widescreen
            prs.slide_width = Inches(13.33)
            prs.slide_height = Inches(7.5)
            print(f"Using default widescreen dimensions")
        
        # Create the unit slide
        slide = _create_unit_slide(prs, unit_data, {})
        
        # Save presentation
        print(f"Saving presentation to: {output_path}")
        prs.save(output_path)
        print(f"PowerPoint saved successfully")
        
        return output_path
        
    except Exception as e:
        print(f"Error in create_unit_powerpoint: {e}")
        import traceback
        traceback.print_exc()
        raise

def create_group_powerpoint(group_data: Dict[str, Any], output_path: str) -> str:
    """
    Create a PowerPoint presentation from a group's naval units
    
    Args:
        group_data: Group data including naval units and presentation config
        output_path: Path where to save the PowerPoint file
    
    Returns:
        Path to the created PowerPoint file
    """
    
    try:
        print(f"Creating PowerPoint for group: {group_data.get('name', 'Unknown')}")
        
        # Create new presentation
        prs = Presentation()
        
        # Set slide dimensions to 16:9 widescreen
        prs.slide_width = Inches(13.33)
        prs.slide_height = Inches(7.5)
        
        print(f"Presentation created with widescreen dimensions")
        
        # Create title slide
        title_slide_layout = prs.slide_layouts[0]  # Title slide layout
        title_slide = prs.slides.add_slide(title_slide_layout)
        
        title = title_slide.shapes.title
        subtitle = title_slide.placeholders[1]
        
        group_name = group_data.get('name', 'Gruppo Unità Navali')
        naval_units = group_data.get('naval_units', [])
        
        title.text = group_name
        subtitle.text = f"Presentazione di {len(naval_units)} unità navali"
        
        print(f"Title slide created for {len(naval_units)} units")
        
        # Get presentation config
        presentation_config = group_data.get('presentation_config', {})
        mode = presentation_config.get('mode', 'single')
        
        print(f"Presentation mode: {mode}")
        
        if mode == 'single':
            # Create one slide per unit
            for i, unit in enumerate(naval_units):
                print(f"Creating slide {i+1}/{len(naval_units)} for unit: {unit.get('name', 'Unknown')}")
                try:
                    slide = _create_unit_slide(prs, unit, group_data)
                except Exception as unit_error:
                    print(f"Failed to create slide for unit {unit.get('name', 'Unknown')}: {unit_error}")
                    # Continue with other units
                    continue
        else:
            # Create grid slides
            grid_rows = presentation_config.get('grid_rows', 3)
            grid_cols = presentation_config.get('grid_cols', 3)
            units_per_slide = grid_rows * grid_cols
            
            print(f"Creating grid slides: {grid_rows}x{grid_cols} ({units_per_slide} units per slide)")
            
            # Split units into pages
            for i in range(0, len(naval_units), units_per_slide):
                page_units = naval_units[i:i + units_per_slide]
                page_num = i // units_per_slide + 1
                print(f"Creating grid slide {page_num} with {len(page_units)} units")
                try:
                    slide = _create_grid_slide(prs, page_units, group_data, grid_rows, grid_cols, page_num)
                except Exception as grid_error:
                    print(f"Failed to create grid slide {page_num}: {grid_error}")
                    continue
        
        # Save presentation
        print(f"Saving presentation to: {output_path}")
        prs.save(output_path)
        print(f"PowerPoint saved successfully")
        
        return output_path
        
    except Exception as e:
        print(f"Error in create_group_powerpoint: {e}")
        import traceback
        traceback.print_exc()
        raise

def _create_unit_slide(prs: Presentation, unit: Dict[str, Any], group_data: Dict[str, Any]) -> Any:
    """Create a single slide for one naval unit"""
    
    try:
        print(f"Creating slide for unit: {unit.get('name', 'Unknown')}")
        
        # Use blank slide layout
        blank_slide_layout = prs.slide_layouts[6]
        slide = prs.slides.add_slide(blank_slide_layout)
        
        # Get unit layout config with safe parsing
        layout_config = unit.get('layout_config', {})
        
        # Handle case where layout_config might be a JSON string
        if isinstance(layout_config, str):
            try:
                import json
                layout_config = json.loads(layout_config)
            except (json.JSONDecodeError, TypeError):
                print(f"Failed to parse layout_config JSON for unit {unit.get('name')}, using default")
                layout_config = {}
        
        elements = layout_config.get('elements', [])
        canvas_background = layout_config.get('canvasBackground', '#ffffff')
        
        print(f"Unit has {len(elements)} elements, background: {canvas_background}")
        
        # Set slide background color
        try:
            background = slide.background
            fill = background.fill
            fill.solid()
            fill.fore_color.rgb = _hex_to_rgb(canvas_background)
        except Exception as bg_error:
            print(f"Failed to set background color: {bg_error}")
        
        # Add canvas border if specified
        canvas_border_width = layout_config.get('canvasBorderWidth', 0)
        canvas_border_color = layout_config.get('canvasBorderColor', '#000000')
        
        if canvas_border_width > 0:
            try:
                # Add border as a rectangle shape
                border_shape = slide.shapes.add_shape(
                    1,  # Rectangle auto shape
                    Inches(0), Inches(0),
                    _pixels_to_inches(layout_config.get('canvasWidth', 1123)),
                    _pixels_to_inches(layout_config.get('canvasHeight', 794))
                )
                
                # Configure border
                border_shape.fill.background()  # No fill, just border
                border_shape.line.color.rgb = _hex_to_rgb(canvas_border_color)
                border_shape.line.width = Pt(canvas_border_width)
                
                print(f"Added canvas border: {canvas_border_width}pt, color: {canvas_border_color}")
            except Exception as border_error:
                print(f"Failed to add canvas border: {border_error}")
        
        # Process each element from the canvas
        for i, element in enumerate(elements):
            try:
                print(f"Processing element {i+1}/{len(elements)}: {element.get('type', 'unknown')}")
                _add_element_to_slide(slide, element, unit, group_data)
            except Exception as element_error:
                print(f"Error processing element {i+1}: {element_error}")
                continue  # Skip problematic elements but continue with others
        
        print(f"Slide created successfully for unit: {unit.get('name')}")
        return slide
        
    except Exception as e:
        print(f"Error creating slide for unit {unit.get('name', 'Unknown')}: {e}")
        # Create a minimal slide with just the unit name as fallback
        blank_slide_layout = prs.slide_layouts[6]
        slide = prs.slides.add_slide(blank_slide_layout)
        
        # Add unit name as fallback
        text_box = slide.shapes.add_textbox(Inches(1), Inches(1), Inches(10), Inches(1))
        text_frame = text_box.text_frame
        text_frame.text = f"{unit.get('name', 'Unknown Unit')} - {unit.get('unit_class', 'Unknown Class')}"
        
        return slide

def _create_grid_slide(prs: Presentation, units: List[Dict[str, Any]], group_data: Dict[str, Any], 
                      rows: int, cols: int, page_num: int) -> Any:
    """Create a grid slide with multiple units"""
    
    blank_slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_slide_layout)
    
    # Add page title
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.2), Inches(12), Inches(0.8))
    title_frame = title_box.text_frame
    title_frame.text = f"{group_data.get('name', 'Gruppo')} - Pagina {page_num}"
    title_para = title_frame.paragraphs[0]
    title_para.alignment = PP_ALIGN.CENTER
    title_para.font.size = Pt(24)
    title_para.font.bold = True
    
    # Calculate grid dimensions
    slide_width = Inches(12.5)  # Leave margins
    slide_height = Inches(6)    # Leave space for title
    cell_width = slide_width / cols
    cell_height = slide_height / rows
    
    # Place units in grid
    for i, unit in enumerate(units):
        row = i // cols
        col = i % cols
        
        x = Inches(0.5) + col * cell_width
        y = Inches(1) + row * cell_height
        
        _add_unit_to_grid_cell(slide, unit, group_data, x, y, cell_width, cell_height)
    
    return slide

def _add_unit_to_grid_cell(slide: Any, unit: Dict[str, Any], group_data: Dict[str, Any], 
                          x: Inches, y: Inches, width: Inches, height: Inches):
    """Add a unit summary to a grid cell"""
    
    # Add cell border
    cell_box = slide.shapes.add_textbox(x, y, width, height)
    
    # Add unit name
    name_box = slide.shapes.add_textbox(x + Inches(0.1), y + Inches(0.1), 
                                       width - Inches(0.2), Inches(0.4))
    name_frame = name_box.text_frame
    name_frame.text = unit.get('name', 'Nome Unità')
    name_para = name_frame.paragraphs[0]
    name_para.alignment = PP_ALIGN.CENTER
    name_para.font.size = Pt(14)
    name_para.font.bold = True
    
    # Add unit class
    class_box = slide.shapes.add_textbox(x + Inches(0.1), y + Inches(0.5), 
                                        width - Inches(0.2), Inches(0.3))
    class_frame = class_box.text_frame
    class_frame.text = f"Classe: {unit.get('unit_class', 'N/A')}"
    class_para = class_frame.paragraphs[0]
    class_para.alignment = PP_ALIGN.CENTER
    class_para.font.size = Pt(10)
    
    # Try to add silhouette if available
    layout_config = unit.get('layout_config', {})
    elements = layout_config.get('elements', [])
    silhouette_element = next((el for el in elements if el.get('type') == 'silhouette' and el.get('image')), None)
    
    if silhouette_element and silhouette_element.get('image'):
        try:
            # Add silhouette image (simplified - would need proper image handling)
            img_y = y + Inches(0.8)
            img_height = height - Inches(1.0)
            # Note: Real implementation would need to handle image loading and sizing
        except Exception:
            pass

def _add_element_to_slide(slide: Any, element: Dict[str, Any], unit: Dict[str, Any], group_data: Dict[str, Any]):
    """Add a canvas element to the slide"""
    
    element_type = element.get('type')
    x = _pixels_to_inches(element.get('x', 0))
    y = _pixels_to_inches(element.get('y', 0))
    width = _pixels_to_inches(element.get('width', 100))
    height = _pixels_to_inches(element.get('height', 30))
    
    if element_type in ['text', 'unit_name', 'unit_class']:
        # Add text element
        text_box = slide.shapes.add_textbox(x, y, width, height)
        text_frame = text_box.text_frame
        text_frame.text = element.get('content', '')
        
        # Apply styling
        paragraph = text_frame.paragraphs[0]
        font = paragraph.font
        
        style = element.get('style', {})
        font.size = Pt(style.get('fontSize', 16))
        font.bold = style.get('fontWeight') == 'bold'
        
        # Text color
        color = style.get('color', '#000000')
        font.color.rgb = _hex_to_rgb(color)
        
        # Text alignment
        text_align = style.get('textAlign', 'left')
        if text_align == 'center':
            paragraph.alignment = PP_ALIGN.CENTER
        elif text_align == 'right':
            paragraph.alignment = PP_ALIGN.RIGHT
        
        # Apply background color and borders
        if style.get('backgroundColor'):
            text_box.fill.solid()
            text_box.fill.fore_color.rgb = _hex_to_rgb(style.get('backgroundColor'))
        
        # Apply borders
        border_width = style.get('borderWidth', 0)
        if border_width > 0:
            text_box.line.color.rgb = _hex_to_rgb(style.get('borderColor', '#000000'))
            text_box.line.width = Pt(border_width)
            border_style = style.get('borderStyle', 'solid')
            # PowerPoint supports different line styles, but solid is most compatible
        
        # Apply border radius (limited support in PowerPoint)
        border_radius = style.get('borderRadius', 0)
        if border_radius > 0:
            # PowerPoint has limited border radius support, this is approximate
            try:
                text_box.adjustments[0] = border_radius / 100.0  # Approximate conversion
            except:
                pass  # Ignore if adjustments not available
    
    elif element_type in ['logo', 'flag', 'silhouette']:
        # Handle images - with remote URL support
        image_path = element.get('image')
        if image_path:
            temp_files_to_cleanup = []
            try:
                # Apply group template overrides
                if element_type == 'logo' and group_data.get('override_logo') and group_data.get('template_logo_path'):
                    image_path = group_data.get('template_logo_path')
                elif element_type == 'flag' and group_data.get('override_flag') and group_data.get('template_flag_path'):
                    image_path = group_data.get('template_flag_path')
                
                print(f"Processing {element_type} image: {image_path}")
                
                # Get the actual image path (download if remote)
                actual_image_path = _get_image_path(image_path)
                
                if actual_image_path:
                    # If it was downloaded, mark for cleanup
                    if image_path.startswith('http'):
                        temp_files_to_cleanup.append(actual_image_path)
                    
                    try:
                        print(f"Adding {element_type} image to slide: {actual_image_path}")
                        slide.shapes.add_picture(actual_image_path, x, y, width, height)
                        print(f"Successfully added {element_type} image")
                        
                        # Clean up temporary files
                        for temp_file in temp_files_to_cleanup:
                            try:
                                os.unlink(temp_file)
                                print(f"Cleaned up temporary file: {temp_file}")
                            except:
                                pass
                        
                    except Exception as img_error:
                        print(f"Error adding image {actual_image_path}: {img_error}")
                        # Clean up temporary files on error
                        for temp_file in temp_files_to_cleanup:
                            try:
                                os.unlink(temp_file)
                            except:
                                pass
                        # Add placeholder text if image fails
                        text_box = slide.shapes.add_textbox(x, y, width, height)
                        text_frame = text_box.text_frame
                        text_frame.text = f"[{element_type.upper()}]"
                else:
                    print(f"Could not get image for {element_type}: {image_path}")
                    # Add placeholder text if file doesn't exist
                    text_box = slide.shapes.add_textbox(x, y, width, height)
                    text_frame = text_box.text_frame
                    text_frame.text = f"[{element_type.upper()}]"
            except Exception as e:
                print(f"Exception processing {element_type} image: {e}")
                # Clean up temporary files on error
                for temp_file in temp_files_to_cleanup:
                    try:
                        os.unlink(temp_file)
                    except:
                        pass
                # If image fails, add placeholder text
                text_box = slide.shapes.add_textbox(x, y, width, height)
                text_frame = text_box.text_frame
                text_frame.text = f"[{element_type.upper()}]"
    
    elif element_type == 'table':
        # Add table data as a real PowerPoint table
        table_data = element.get('tableData', [])
        if table_data and len(table_data) > 0:
            try:
                rows = len(table_data)
                cols = len(table_data[0]) if rows > 0 else 2
                
                # Create PowerPoint table
                table_shape = slide.shapes.add_table(rows, cols, x, y, width, height)
                table = table_shape.table
                
                # Set table data
                for row_idx, row_data in enumerate(table_data):
                    for col_idx, cell_data in enumerate(row_data):
                        if col_idx < cols:  # Safety check
                            cell = table.cell(row_idx, col_idx)
                            cell.text = str(cell_data)
                            
                            # Style the cell
                            cell_font = cell.text_frame.paragraphs[0].font
                            cell_font.size = Pt(9)
                            
                            # Style header row differently
                            if row_idx == 0:
                                cell_font.bold = True
                                cell_font.color.rgb = RGBColor(255, 255, 255)  # White text
                                cell.fill.solid()
                                cell.fill.fore_color.rgb = RGBColor(31, 73, 125)  # Dark blue background
                            else:
                                # Alternate row colors for better readability
                                if row_idx % 2 == 0:
                                    cell.fill.solid()
                                    cell.fill.fore_color.rgb = RGBColor(242, 242, 242)  # Light gray
                                else:
                                    cell.fill.solid()
                                    cell.fill.fore_color.rgb = RGBColor(255, 255, 255)  # White
                
                # Set table style
                table_shape.table.first_row = True  # Enable header row formatting
                
                print(f"Created PowerPoint table with {rows} rows and {cols} columns")
                
            except Exception as table_error:
                print(f"Error creating PowerPoint table: {table_error}")
                # Fallback to text if table creation fails
                text_content = []
                for row in table_data:
                    text_content.append(' | '.join(str(cell) for cell in row))
                
                text_box = slide.shapes.add_textbox(x, y, width, height)
                text_frame = text_box.text_frame
                text_frame.text = '\n'.join(text_content)
                
                # Style as table-like
                paragraph = text_frame.paragraphs[0]
                font = paragraph.font
                font.size = Pt(10)

def _pixels_to_inches(pixels: float) -> Inches:
    """Convert pixels to inches (assuming 96 DPI)"""
    return Inches(pixels / 96.0)

def _download_image(image_url: str) -> Optional[str]:
    """Download image from URL and return temporary file path"""
    try:
        print(f"Downloading image from: {image_url}")
        
        # Set headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Get file extension from URL or default to .png
        file_ext = '.png'
        if '.' in image_url.split('/')[-1]:
            file_ext = '.' + image_url.split('.')[-1].split('?')[0]  # Remove query params
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            tmp_file.write(response.content)
            temp_path = tmp_file.name
        
        print(f"Image downloaded successfully to: {temp_path}")
        return temp_path
        
    except Exception as e:
        print(f"Error downloading image {image_url}: {e}")
        return None

def _get_image_path(image_path: str) -> Optional[str]:
    """Get the correct image path, downloading remote images if needed"""
    if not image_path:
        return None
    
    # If it's an HTTP URL, download it
    if image_path.startswith('http://') or image_path.startswith('https://'):
        return _download_image(image_path)
    
    # Handle local file paths
    if image_path.startswith('/api/static/'):
        local_path = image_path.replace('/api/static/', './data/uploads/')
    elif image_path.startswith('../data/uploads/'):
        local_path = image_path.replace('../data/uploads/', './data/uploads/')
    elif not image_path.startswith('./data/uploads/'):
        local_path = f"./data/uploads/{image_path}"
    else:
        local_path = image_path
    
    # Check if local file exists
    if os.path.exists(local_path):
        return local_path
    else:
        print(f"Local image file not found: {local_path}")
        return None

def _hex_to_rgb(hex_color: str):
    """Convert hex color to RGB"""
    hex_color = hex_color.lstrip('#')
    return RGBColor(
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16)
    )