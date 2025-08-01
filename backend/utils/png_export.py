from PIL import Image, ImageDraw, ImageFont
import os
import json
import io
import requests
from typing import Dict, Any, Optional, List, Union

def create_unit_png(unit_data: Dict[str, Any], output_path: str = None) -> str:
    """
    Create a PNG image from a single naval unit using server-side rendering
    
    Args:
        unit_data: Unit data including layout config
        output_path: Path where to save the PNG file (optional, for backwards compatibility)
    
    Returns:
        Path to the created PNG file or BytesIO if output_path is None
    """
    
    try:
        print(f"Creating PNG for unit: {unit_data.get('name', 'Unknown')}")
        
        # Get layout configuration
        layout_config = unit_data.get('layout_config', {})
        elements = layout_config.get('elements', [])
        
        # Canvas dimensions
        canvas_width = layout_config.get('canvasWidth', 1280)
        canvas_height = layout_config.get('canvasHeight', 720)
        canvas_background = layout_config.get('canvasBackground', '#ffffff')
        
        print(f"Canvas dimensions: {canvas_width}x{canvas_height}")
        print(f"Canvas background: {canvas_background}")
        print(f"Elements to render: {len(elements)}")
        
        # Create image
        image = Image.new('RGB', (canvas_width, canvas_height), canvas_background)
        draw = ImageDraw.Draw(image)
        
        # Add canvas border if specified
        border_width = layout_config.get('canvasBorderWidth', 0)
        border_color = layout_config.get('canvasBorderColor', '#000000')
        
        if border_width > 0:
            # Draw border
            for i in range(border_width):
                draw.rectangle([i, i, canvas_width-1-i, canvas_height-1-i], outline=border_color)
            print(f"Added canvas border: {border_width}px, color: {border_color}")
        
        # If no elements but unit has direct image fields, create basic elements
        if len(elements) == 0:
            print("No elements found in layout_config, creating basic elements from unit data")
            elements = _create_basic_elements_from_unit_data(unit_data)
            print(f"Created {len(elements)} basic elements")
        
        # Process each element
        for i, element in enumerate(elements):
            try:
                print(f"Processing element {i+1}/{len(elements)}: {element.get('type', 'unknown')}")
                _add_element_to_image(draw, image, element, unit_data)
            except Exception as element_error:
                print(f"Error processing element {i+1}: {element_error}")
                import traceback
                traceback.print_exc()
                continue  # Skip problematic elements but continue with others
        
        # Save image
        print(f"Saving PNG to: {output_path}")
        image.save(output_path, 'PNG', quality=95)
        print(f"PNG saved successfully")
        
        return output_path
        
    except Exception as e:
        print(f"Error in create_unit_png: {e}")
        import traceback
        traceback.print_exc()
        raise

def create_unit_png_to_buffer(unit_data: Dict[str, Any], output_buffer: io.BytesIO) -> None:
    """
    Create a PNG image from a single naval unit and save to buffer
    
    Args:
        unit_data: Unit data including layout config
        output_buffer: BytesIO buffer to save the PNG
    """
    
    try:
        print(f"Creating PNG in memory for unit: {unit_data.get('name', 'Unknown')}")
        
        # Get layout configuration
        layout_config = unit_data.get('layout_config', {})
        elements = layout_config.get('elements', [])
        
        # Canvas dimensions
        canvas_width = layout_config.get('canvasWidth', 1280)
        canvas_height = layout_config.get('canvasHeight', 720)
        canvas_background = layout_config.get('canvasBackground', '#ffffff')
        
        print(f"Canvas dimensions: {canvas_width}x{canvas_height}")
        print(f"Canvas background: {canvas_background}")
        print(f"Elements to render: {len(elements)}")
        
        # Create image
        image = Image.new('RGB', (canvas_width, canvas_height), canvas_background)
        draw = ImageDraw.Draw(image)
        
        # Add canvas border if specified
        border_width = layout_config.get('canvasBorderWidth', 0)
        border_color = layout_config.get('canvasBorderColor', '#000000')
        
        if border_width > 0:
            # Draw border
            for i in range(border_width):
                draw.rectangle([i, i, canvas_width-1-i, canvas_height-1-i], outline=border_color)
            print(f"Added canvas border: {border_width}px, color: {border_color}")
        
        # If no elements but unit has direct image fields, create basic elements
        if len(elements) == 0:
            print("No elements found in layout_config, creating basic elements from unit data")
            elements = _create_basic_elements_from_unit_data(unit_data)
            print(f"Created {len(elements)} basic elements")
        
        # Process each element
        for i, element in enumerate(elements):
            try:
                print(f"Processing element {i+1}/{len(elements)}: {element.get('type', 'unknown')}")
                _add_element_to_image(draw, image, element, unit_data)
            except Exception as element_error:
                print(f"Error processing element {i+1}: {element_error}")
                import traceback
                traceback.print_exc()
                continue  # Skip problematic elements but continue with others
        
        # Save image to buffer
        print(f"Saving PNG to buffer")
        image.save(output_buffer, 'PNG', quality=95)
        print(f"PNG saved successfully to buffer")
        
    except Exception as e:
        print(f"Error in create_unit_png_to_buffer: {e}")
        import traceback
        traceback.print_exc()
        raise

def _add_element_to_image(draw: ImageDraw.Draw, image: Image.Image, element: Dict[str, Any], unit_data: Dict[str, Any]):
    """Add a canvas element to the image"""
    
    element_type = element.get('type')
    x = int(element.get('x', 0))
    y = int(element.get('y', 0))
    width = int(element.get('width', 100))
    height = int(element.get('height', 30))
    style = element.get('style', {})
    
    print(f"  Element: {element_type} at ({x}, {y}) size {width}x{height}")
    
    if element_type in ['text', 'unit_name', 'unit_class']:
        # Add text element
        content = element.get('content', '')
        if not content:
            # For unit_name and unit_class, get from unit data
            if element_type == 'unit_name':
                content = unit_data.get('name', '')
            elif element_type == 'unit_class':
                content = unit_data.get('unit_class', '')
        
        print(f"    Text content: '{content}'")
        print(f"    Raw style properties: {style}")
        
        # Complete text styling from CSS properties
        font_family = style.get('fontFamily', 'Arial')
        
        # Font size - può essere numero o stringa con unità
        font_size_raw = style.get('fontSize', 16)
        if isinstance(font_size_raw, str):
            font_size = int(font_size_raw.replace('px', '').replace('pt', '').replace('em', '').replace('rem', ''))
        else:
            font_size = int(font_size_raw)
        
        font_weight = style.get('fontWeight', 'normal')
        font_style = style.get('fontStyle', 'normal')  # italic, oblique
        text_color = style.get('color', '#000000')
        text_align = style.get('textAlign', 'left')
        text_decoration = style.get('textDecoration', 'none')  # underline, line-through
        text_transform = style.get('textTransform', 'none')  # uppercase, lowercase, capitalize
        
        # Letter spacing - può essere numero o stringa
        letter_spacing_raw = style.get('letterSpacing', 0)
        if isinstance(letter_spacing_raw, str):
            letter_spacing = float(letter_spacing_raw.replace('px', '').replace('em', '').replace('rem', ''))
        else:
            letter_spacing = float(letter_spacing_raw) if letter_spacing_raw else 0
        
        # Line height - può essere numero o stringa
        line_height_raw = style.get('lineHeight', 1.2)
        if isinstance(line_height_raw, str):
            if 'px' in line_height_raw:
                line_height = float(line_height_raw.replace('px', '')) / font_size  # Convert px to multiplier
            else:
                line_height = float(line_height_raw.replace('em', '').replace('rem', ''))
        else:
            line_height = float(line_height_raw) if line_height_raw else 1.2
        
        print(f"    Parsed formatting -> Font: {font_family} {font_size}px {font_weight} {font_style}")
        print(f"    Parsed formatting -> Color: {text_color}, Align: {text_align}")
        print(f"    Parsed formatting -> Transform: {text_transform}, Decoration: {text_decoration}")
        
        # Background and borders
        bg_color = style.get('backgroundColor')
        border_width = int(style.get('borderWidth', 0)) if style.get('borderWidth') else 0
        border_color = style.get('borderColor', '#000000')
        border_radius = int(style.get('borderRadius', 0)) if style.get('borderRadius') else 0
        
        # Padding - può essere un numero o una stringa come "8px"
        padding = style.get('padding', 8)
        if isinstance(padding, str):
            padding = int(padding.replace('px', '').replace('em', '').replace('rem', ''))
        elif padding is None:
            padding = 8
        
        print(f"    Parsed styling -> Background: {bg_color}, Border: {border_width}px {border_color}")
        print(f"    Parsed styling -> Padding: {padding}px, Border radius: {border_radius}px")
        
        # Apply text transformations
        if text_transform == 'uppercase':
            content = content.upper()
        elif text_transform == 'lowercase':
            content = content.lower()
        elif text_transform == 'capitalize':
            content = content.title()
        
        # Draw background if specified
        if bg_color:
            draw.rectangle([x, y, x + width, y + height], fill=bg_color)
        
        # Draw border if specified
        if border_width > 0:
            for i in range(border_width):
                draw.rectangle([x + i, y + i, x + width - 1 - i, y + height - 1 - i], outline=border_color)
        
        # Load appropriate font
        font = _get_font(font_family, font_size, font_weight, font_style)
        
        # Handle multi-line text if needed
        lines = content.split('\n') if '\n' in content else [content]
        
        # Calculate text dimensions for all lines
        total_text_height = 0
        line_heights = []
        line_widths = []
        
        for line in lines:
            line_bbox = draw.textbbox((0, 0), line, font=font)
            line_width = line_bbox[2] - line_bbox[0]
            calculated_line_height = int((line_bbox[3] - line_bbox[1]) * line_height)
            line_heights.append(calculated_line_height)
            line_widths.append(line_width)
            total_text_height += calculated_line_height
        
        # Calculate starting Y position (vertical alignment)
        text_start_y = y + (height - total_text_height) // 2
        
        # Draw each line
        current_y = text_start_y
        for i, line in enumerate(lines):
            line_width = line_widths[i]
            calculated_line_height = line_heights[i]
            
            # Calculate X position based on alignment
            if text_align == 'center':
                text_x = x + (width - line_width) // 2
            elif text_align == 'right':
                text_x = x + width - line_width - padding
            else:  # left alignment (default)
                text_x = x + padding
            
            # Draw the text line
            draw.text((text_x, current_y), line, fill=text_color, font=font)
            
            # Draw text decorations
            if text_decoration == 'underline':
                underline_y = current_y + calculated_line_height - 2
                draw.line([text_x, underline_y, text_x + line_width, underline_y], fill=text_color, width=1)
            elif text_decoration == 'line-through':
                strikethrough_y = current_y + calculated_line_height // 2
                draw.line([text_x, strikethrough_y, text_x + line_width, strikethrough_y], fill=text_color, width=1)
            
            current_y += calculated_line_height
        
        print(f"    Drew text: '{content}' with font: {font_family} {font_size}px {font_weight} {font_style}, color: {text_color}, align: {text_align}")
    
    elif element_type in ['logo', 'flag', 'silhouette']:
        # Draw background first if specified
        bg_color = style.get('backgroundColor')
        border_width = style.get('borderWidth', 0)
        border_color = style.get('borderColor', '#000000')
        border_radius = style.get('borderRadius', 0)
        
        if bg_color:
            print(f"    Drawing background: {bg_color}")
            draw.rectangle([x, y, x + width, y + height], fill=bg_color)
        
        # Draw border if specified
        if border_width > 0:
            print(f"    Drawing border: {border_width}px, color: {border_color}")
            for i in range(border_width):
                draw.rectangle([x + i, y + i, x + width - 1 - i, y + height - 1 - i], outline=border_color)
        
        # Handle images
        image_path = element.get('image')
        if image_path:
            try:
                # Get the actual image path (includes download for remote URLs)
                actual_image_path = _get_image_path_png(image_path)
                
                if actual_image_path and os.path.exists(actual_image_path):
                    print(f"    Loading image: {actual_image_path}")
                    
                    # Load and resize image
                    element_img = Image.open(actual_image_path)
                    
                    # Convert to RGB if necessary
                    if element_img.mode in ('RGBA', 'LA', 'P'):
                        if bg_color:
                            # Use element background color
                            bg_rgb = tuple(int(bg_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
                            background = Image.new('RGB', element_img.size, bg_rgb)
                        else:
                            background = Image.new('RGB', element_img.size, (255, 255, 255))
                        if element_img.mode == 'P':
                            element_img = element_img.convert('RGBA')
                        if element_img.mode == 'RGBA':
                            background.paste(element_img, mask=element_img.split()[-1])
                        else:
                            background.paste(element_img)
                        element_img = background
                    
                    # Resize maintaining aspect ratio
                    element_img.thumbnail((width - 2*border_width, height - 2*border_width), Image.Resampling.LANCZOS)
                    
                    # Center the image within the element bounds
                    img_width, img_height = element_img.size
                    paste_x = x + border_width + (width - 2*border_width - img_width) // 2
                    paste_y = y + border_width + (height - 2*border_width - img_height) // 2
                    
                    # Paste image
                    image.paste(element_img, (paste_x, paste_y))
                    print(f"    Pasted image at ({paste_x}, {paste_y}) size {img_width}x{img_height}")
                
                else:
                    print(f"    Image not found, showing placeholder")
                    # Draw placeholder text
                    placeholder_text = f"[{element_type.upper()}]"
                    font = _get_font('Arial', 12, 'normal', 'normal')
                    
                    text_bbox = draw.textbbox((0, 0), placeholder_text, font=font)
                    text_width = text_bbox[2] - text_bbox[0]
                    text_height = text_bbox[3] - text_bbox[1]
                    
                    text_x = x + (width - text_width) // 2
                    text_y = y + (height - text_height) // 2
                    
                    draw.text((text_x, text_y), placeholder_text, fill='#888888', font=font)
            
            except Exception as img_error:
                print(f"    Error loading image: {img_error}")
                # Draw error placeholder
                placeholder_text = f"[ERROR: {element_type.upper()}]"
                font = _get_font('Arial', 10, 'normal', 'normal')
                
                text_bbox = draw.textbbox((0, 0), placeholder_text, font=font)
                text_width = text_bbox[2] - text_bbox[0]
                text_height = text_bbox[3] - text_bbox[1]
                
                text_x = x + (width - text_width) // 2
                text_y = y + (height - text_height) // 2
                
                draw.text((text_x, text_y), placeholder_text, fill='#ff0000', font=font)
    
    elif element_type == 'table':
        # Handle table elements
        table_data = element.get('tableData', [])
        if table_data and len(table_data) > 0:
            print(f"    Drawing table with {len(table_data)} rows")
            
            # Draw table background
            bg_color = style.get('backgroundColor', '#ffffff')
            draw.rectangle([x, y, x + width, y + height], fill=bg_color)
            
            # Draw table border
            border_width = style.get('borderWidth', 1)
            border_color = style.get('borderColor', '#000000')
            if border_width > 0:
                for i in range(border_width):
                    draw.rectangle([x + i, y + i, x + width - 1 - i, y + height - 1 - i], outline=border_color)
            
            # Calculate row and column dimensions
            num_rows = len(table_data)
            num_cols = len(table_data[0]) if num_rows > 0 else 0
            
            if num_rows > 0 and num_cols > 0:
                cell_height = (height - 2 * border_width) // num_rows
                column_widths = style.get('columnWidths', [])
                
                # Calculate cell widths
                cell_widths = []
                total_percentage = sum(column_widths) if column_widths else 100
                available_width = width - 2 * border_width
                
                for col_index in range(num_cols):
                    if col_index < len(column_widths):
                        cell_width = int((column_widths[col_index] / total_percentage) * available_width)
                    else:
                        cell_width = available_width // num_cols
                    cell_widths.append(cell_width)
                
                # Draw table cells
                current_y = y + border_width
                for row_index, row_data in enumerate(table_data):
                    current_x = x + border_width
                    is_header = row_index == 0
                    
                    for col_index, cell_data in enumerate(row_data):
                        if col_index >= len(cell_widths):
                            break
                            
                        cell_width = cell_widths[col_index]
                        
                        # Cell background color
                        if is_header:
                            cell_bg = style.get('headerBackgroundColor', '#f3f4f6')
                        else:
                            cell_bg = '#f9fafb' if row_index % 2 == 0 else '#ffffff'
                        
                        # Draw cell background
                        draw.rectangle([current_x, current_y, current_x + cell_width, current_y + cell_height], fill=cell_bg)
                        
                        # Draw cell border
                        draw.rectangle([current_x, current_y, current_x + cell_width, current_y + cell_height], outline='#d1d5db')
                        
                        # Draw cell text with proper formatting
                        cell_font_size = 9 if is_header else 8
                        cell_font_weight = 'bold' if is_header else 'normal'
                        cell_font = _get_font('Arial', cell_font_size, cell_font_weight, 'normal')
                        
                        cell_text = str(cell_data)
                        text_bbox = draw.textbbox((0, 0), cell_text, font=cell_font)
                        text_width = text_bbox[2] - text_bbox[0]
                        text_height = text_bbox[3] - text_bbox[1]
                        
                        # Center text in cell
                        text_x = current_x + 4  # Left padding
                        text_y = current_y + (cell_height - text_height) // 2
                        
                        # Ensure text fits in cell
                        if text_width > cell_width - 8:
                            # Truncate text if too long
                            while len(cell_text) > 0 and draw.textbbox((0, 0), cell_text + "...", font=cell_font)[2] > cell_width - 8:
                                cell_text = cell_text[:-1]
                            cell_text += "..." if len(cell_text) < len(str(cell_data)) else ""
                        
                        text_color = '#000000' if is_header else '#374151'
                        draw.text((text_x, text_y), cell_text, fill=text_color, font=cell_font)
                        
                        current_x += cell_width
                    
                    current_y += cell_height
                    
            print(f"    Table drawn successfully")
        else:
            print(f"    Empty table data, skipping")

def _get_image_path_png(image_path: str) -> Optional[str]:
    """Get the correct image path for PNG export"""
    if not image_path:
        return None
    
    print(f"    Resolving image path: {image_path}")
    
    # Handle base64 images (convert to temp file if needed)
    if image_path.startswith('data:image/'):
        print(f"    Base64 image detected, converting to temp file")
        return _convert_base64_to_temp_file_png(image_path)
    
    # Handle remote URLs (download them)
    if image_path.startswith('http://') or image_path.startswith('https://'):
        print(f"    Remote URL detected, downloading: {image_path}")
        return _download_remote_image_png(image_path)
    
    # Handle URL paths (like /uploads/flags/filename.png)
    if image_path.startswith('/uploads/'):
        local_path = image_path.replace('/uploads/', './data/uploads/')
        print(f"    Converted /uploads/ path: {image_path} -> {local_path}")
    elif image_path.startswith('/api/static/'):
        local_path = image_path.replace('/api/static/', './data/uploads/')
        print(f"    Converted /api/static/ path: {image_path} -> {local_path}")
    elif image_path.startswith('../data/uploads/'):
        local_path = image_path.replace('../data/uploads/', './data/uploads/')
        print(f"    Converted ../ path: {image_path} -> {local_path}")
    elif not image_path.startswith('./data/uploads/'):
        # Handle paths like "flags/filename.png"
        local_path = f"./data/uploads/{image_path}"
        print(f"    Added data/uploads prefix: {image_path} -> {local_path}")
    else:
        local_path = image_path
        print(f"    Using path as-is: {local_path}")
    
    print(f"    Checking path: {local_path}")
    
    # Check if local file exists
    if os.path.exists(local_path):
        print(f"    File found: {local_path}")
        return local_path
    else:
        print(f"    File not found: {local_path}")
        
        # Try different path variations
        variations = [
            image_path,
            os.path.join('./data/uploads', os.path.basename(image_path)),
            os.path.join('./data/uploads/silhouettes', os.path.basename(image_path)),
            os.path.join('./data/uploads/logos', os.path.basename(image_path)),
            os.path.join('./data/uploads/flags', os.path.basename(image_path))
        ]
        
        for variation in variations:
            print(f"    Trying variation: {variation}")
            if os.path.exists(variation):
                print(f"    Found at variation: {variation}")
                return variation
        
        print(f"    No variations found")
        return None

def _convert_base64_to_temp_file_png(base64_data: str) -> Optional[str]:
    """Convert base64 image data to temporary file for PNG export"""
    try:
        print(f"    Converting base64 to temp file")
        
        # Extract the base64 data
        if ',' in base64_data:
            header, data = base64_data.split(',', 1)
            # Extract format from header (e.g., data:image/png;base64)
            if 'image/' in header:
                image_format = header.split('image/')[1].split(';')[0]
            else:
                image_format = 'png'  # default
        else:
            data = base64_data
            image_format = 'png'
        
        # Decode base64
        import base64
        image_data = base64.b64decode(data)
        
        # Create temporary file in server directory
        temp_dir = "./data/temp"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        temp_filename = f"img_{uuid.uuid4().hex}.{image_format}"
        temp_path = os.path.join(temp_dir, temp_filename)
        
        # Write image data
        with open(temp_path, 'wb') as f:
            f.write(image_data)
        
        print(f"    Base64 converted to temp file: {temp_path}")
        return temp_path
        
    except Exception as e:
        print(f"    Failed to convert base64 to temp file: {e}")
        return None

def _download_remote_image_png(image_url: str) -> Optional[str]:
    """Download remote image for PNG export"""
    try:
        print(f"    Downloading remote image: {image_url}")
        
        import requests
        
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
        
        # Create temporary file in server directory
        temp_dir = "./data/temp"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        temp_filename = f"download_{uuid.uuid4().hex}{file_ext}"
        temp_path = os.path.join(temp_dir, temp_filename)
        
        # Write downloaded content
        with open(temp_path, 'wb') as f:
            f.write(response.content)
        
        print(f"    Remote image downloaded to: {temp_path}")
        return temp_path
        
    except Exception as e:
        print(f"    Failed to download remote image {image_url}: {e}")
        return None

def _get_font(font_family: str, font_size: int, font_weight: str, font_style: str):
    """Get the appropriate font based on family, size, weight and style"""
    
    # Font mapping - try to find the best available font
    font_paths = {
        'Arial': {
            'normal': {'normal': 'arial.ttf', 'italic': 'ariali.ttf'},
            'bold': {'normal': 'arialbd.ttf', 'italic': 'arialbi.ttf'}
        },
        'Times': {
            'normal': {'normal': 'times.ttf', 'italic': 'timesi.ttf'},
            'bold': {'normal': 'timesbd.ttf', 'italic': 'timesbi.ttf'}
        },
        'Courier': {
            'normal': {'normal': 'cour.ttf', 'italic': 'couri.ttf'},
            'bold': {'normal': 'courbd.ttf', 'italic': 'courbi.ttf'}
        },
        'Verdana': {
            'normal': {'normal': 'verdana.ttf', 'italic': 'verdanai.ttf'},
            'bold': {'normal': 'verdanab.ttf', 'italic': 'verdanaz.ttf'}
        },
        'Calibri': {
            'normal': {'normal': 'calibri.ttf', 'italic': 'calibrii.ttf'},
            'bold': {'normal': 'calibrib.ttf', 'italic': 'calibriz.ttf'}
        },
        'Tahoma': {
            'normal': {'normal': 'tahoma.ttf', 'italic': 'tahoma.ttf'},
            'bold': {'normal': 'tahomabd.ttf', 'italic': 'tahomabd.ttf'}
        }
    }
    
    # Normalize font family name
    font_family_normalized = font_family.replace('"', '').replace("'", "").split(',')[0].strip()
    
    # Map common generic families
    if font_family_normalized.lower() in ['sans-serif', 'system-ui']:
        font_family_normalized = 'Arial'
    elif font_family_normalized.lower() in ['serif']:
        font_family_normalized = 'Times'
    elif font_family_normalized.lower() in ['monospace']:
        font_family_normalized = 'Courier'
    
    # Normalize weight - supporta valori numerici e stringhe
    if isinstance(font_weight, (int, float)):
        weight = 'bold' if font_weight >= 600 else 'normal'
    elif isinstance(font_weight, str):
        if font_weight.lower() in ['bold', 'bolder']:
            weight = 'bold'
        elif font_weight.isdigit() and int(font_weight) >= 600:
            weight = 'bold'
        else:
            weight = 'normal'
    else:
        weight = 'normal'
    
    # Normalize style
    style = 'italic' if font_style in ['italic', 'oblique'] else 'normal'
    
    # Try to find the exact font
    font_file = None
    if font_family_normalized in font_paths:
        try:
            font_file = font_paths[font_family_normalized][weight][style]
        except KeyError:
            # Fallback to normal weight/style
            try:
                font_file = font_paths[font_family_normalized]['normal']['normal']
            except KeyError:
                pass
    
    # Try to load the font
    if font_file:
        try:
            print(f"    Loading font: {font_file} size {font_size}")
            return ImageFont.truetype(font_file, font_size)
        except Exception as e:
            print(f"    Failed to load {font_file}: {e}")
    
    # Fallback fonts in order of preference
    fallback_fonts = ['arial.ttf', 'calibri.ttf', 'verdana.ttf', 'tahoma.ttf']
    
    for fallback in fallback_fonts:
        try:
            print(f"    Fallback to: {fallback} size {font_size}")
            return ImageFont.truetype(fallback, font_size)
        except:
            continue
    
    # Last resort - default font
    print(f"    Using default font size {font_size}")
    try:
        return ImageFont.load_default()
    except:
        # If even default fails, create a basic font
        return ImageFont.load_default()

def _create_basic_elements_from_unit_data(unit_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Create basic elements when layout_config has no elements"""
    elements = []
    
    # Add logo if available
    if unit_data.get('logo_path'):
        elements.append({
            'id': 'logo',
            'type': 'logo',
            'x': 20,
            'y': 20,
            'width': 120,
            'height': 120,
            'image': unit_data['logo_path'],
            'style': {'backgroundColor': '#ffffff', 'borderRadius': 8}
        })
        print("  Added logo element")
    
    # Add flag if available
    if unit_data.get('flag_path'):
        elements.append({
            'id': 'flag',
            'type': 'flag',
            'x': 983,
            'y': 20,
            'width': 120,
            'height': 80,
            'image': unit_data['flag_path'],
            'style': {'backgroundColor': '#ffffff', 'borderRadius': 8}
        })
        print("  Added flag element")
    
    # Add silhouette if available
    if unit_data.get('silhouette_path'):
        elements.append({
            'id': 'silhouette',
            'type': 'silhouette',
            'x': 20,
            'y': 180,
            'width': 1083,
            'height': 300,
            'image': unit_data['silhouette_path'],
            'style': {'backgroundColor': '#ffffff', 'borderRadius': 8}
        })
        print("  Added silhouette element")
    
    # Add unit name
    elements.append({
        'id': 'unit_name',
        'type': 'unit_name',
        'x': 160,
        'y': 30,
        'width': 400,
        'height': 40,
        'content': unit_data.get('name', ''),
        'style': {'fontSize': 24, 'fontWeight': 'bold', 'color': '#000'}
    })
    print("  Added unit name element")
    
    # Add unit class
    elements.append({
        'id': 'unit_class',
        'type': 'unit_class',
        'x': 160,
        'y': 80,
        'width': 400,
        'height': 40,
        'content': unit_data.get('unit_class', ''),
        'style': {'fontSize': 20, 'fontWeight': 'normal', 'color': '#000'}
    })
    print("  Added unit class element")
    
    return elements