import { useState, useRef } from 'react';
import type { NavalUnit, UnitCharacteristic } from '../types/index.ts';

interface CardEditorProps {
  unit?: NavalUnit | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

interface CardData {
  name: string;
  unit_class: string;
  nation: string;
  background_color: string;
  logo_file: File | null;
  silhouette_file: File | null;
  flag_file: File | null;
  silhouette_zoom: number;
  silhouette_position_x: number;
  silhouette_position_y: number;
  characteristics: UnitCharacteristic[];
}

export default function CardEditor({ unit, onSave, onCancel }: CardEditorProps) {
  const [cardData, setCardData] = useState<CardData>({
    name: unit?.name || '',
    unit_class: unit?.unit_class || '',
    nation: unit?.nation || '',
    background_color: unit?.background_color || '#ffffff',
    logo_file: null,
    silhouette_file: null,
    flag_file: null,
    silhouette_zoom: parseFloat(unit?.silhouette_zoom || '1'),
    silhouette_position_x: parseFloat(unit?.silhouette_position_x || '0'),
    silhouette_position_y: parseFloat(unit?.silhouette_position_y || '0'),
    characteristics: unit?.characteristics || []
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(
    unit?.logo_path ? `http://localhost:8001/static/${unit.logo_path}` : null
  );
  const [silhouettePreview, setSilhouettePreview] = useState<string | null>(
    unit?.silhouette_path ? `http://localhost:8001/static/${unit.silhouette_path}` : null
  );
  const [flagPreview, setFlagPreview] = useState<string | null>(
    unit?.flag_path ? `http://localhost:8001/static/${unit.flag_path}` : null
  );

  const logoInputRef = useRef<HTMLInputElement>(null);
  const silhouetteInputRef = useRef<HTMLInputElement>(null);
  const flagInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (type: 'logo' | 'silhouette' | 'flag', file: File) => {
    const url = URL.createObjectURL(file);
    
    setCardData(prev => ({
      ...prev,
      [`${type}_file`]: file
    }));

    switch (type) {
      case 'logo':
        setLogoPreview(url);
        break;
      case 'silhouette':
        setSilhouettePreview(url);
        break;
      case 'flag':
        setFlagPreview(url);
        break;
    }
  };

  const addCharacteristic = () => {
    const newChar: UnitCharacteristic = {
      id: Date.now(), // Temporary ID
      naval_unit_id: unit?.id || 0,
      characteristic_name: '',
      characteristic_value: '',
      order_index: cardData.characteristics.length
    };
    
    setCardData(prev => ({
      ...prev,
      characteristics: [...prev.characteristics, newChar]
    }));
  };

  const updateCharacteristic = (index: number, field: 'characteristic_name' | 'characteristic_value', value: string) => {
    setCardData(prev => ({
      ...prev,
      characteristics: prev.characteristics.map((char, i) => 
        i === index ? { ...char, [field]: value } : char
      )
    }));
  };

  const removeCharacteristic = (index: number) => {
    setCardData(prev => ({
      ...prev,
      characteristics: prev.characteristics.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(cardData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            {unit ? 'Modifica Scheda' : 'Crea Nuova Scheda'}
          </h1>
          <p className="text-gray-600">
            Progetta la tua scheda unità navale con layout formato A4
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Informazioni Base</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Unità Navale
                  </label>
                  <input
                    type="text"
                    value={cardData.name}
                    onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Es. Andrea Doria"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe Unità
                  </label>
                  <input
                    type="text"
                    value={cardData.unit_class}
                    onChange={(e) => setCardData(prev => ({ ...prev, unit_class: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Es. Destroyer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nazione
                  </label>
                  <input
                    type="text"
                    value={cardData.nation}
                    onChange={(e) => setCardData(prev => ({ ...prev, nation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Es. Italia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colore di Sfondo
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={cardData.background_color}
                      onChange={(e) => setCardData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cardData.background_color}
                      onChange={(e) => setCardData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* File Uploads */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Immagini</h2>
              
              <div className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Unità/Nazione
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Carica Logo
                    </button>
                    {logoPreview && (
                      <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden">
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('logo', e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {/* Silhouette Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Silhouette Nave
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => silhouetteInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Carica Silhouette
                    </button>
                    {silhouettePreview && (
                      <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden">
                        <img src={silhouettePreview} alt="Silhouette preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={silhouetteInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('silhouette', e.target.files[0])}
                    className="hidden"
                  />
                  
                  {/* Zoom and Position Controls */}
                  {silhouettePreview && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zoom: {cardData.silhouette_zoom.toFixed(2)}x
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={cardData.silhouette_zoom}
                          onChange={(e) => setCardData(prev => ({ ...prev, silhouette_zoom: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Posizione X: {cardData.silhouette_position_x}px
                          </label>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={cardData.silhouette_position_x}
                            onChange={(e) => setCardData(prev => ({ ...prev, silhouette_position_x: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Posizione Y: {cardData.silhouette_position_y}px
                          </label>
                          <input
                            type="range"
                            min="-30"
                            max="30"
                            step="1"
                            value={cardData.silhouette_position_y}
                            onChange={(e) => setCardData(prev => ({ ...prev, silhouette_position_y: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setCardData(prev => ({ 
                          ...prev, 
                          silhouette_zoom: 1, 
                          silhouette_position_x: 0, 
                          silhouette_position_y: 0 
                        }))}
                        className="w-full px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
                      >
                        Ripristina Posizione
                      </button>
                    </div>
                  )}
                </div>

                {/* Flag Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bandiera Nazione
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => flagInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Carica Bandiera
                    </button>
                    {flagPreview && (
                      <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden">
                        <img src={flagPreview} alt="Flag preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={flagInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('flag', e.target.files[0])}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Characteristics Table */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-gray-900">Caratteristiche</h2>
                <button
                  onClick={addCharacteristic}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  + Aggiungi
                </button>
              </div>
              
              <div className="space-y-3">
                {cardData.characteristics.map((char, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="text"
                      placeholder="Caratteristica (es. Motori)"
                      value={char.characteristic_name}
                      onChange={(e) => updateCharacteristic(index, 'characteristic_name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Valore (es. 4x Turbina a Gas)"
                        value={char.characteristic_value}
                        onChange={(e) => updateCharacteristic(index, 'characteristic_value', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeCharacteristic(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                
                {cardData.characteristics.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Nessuna caratteristica aggiunta. Clicca "Aggiungi" per iniziare.
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Salva Scheda
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Anteprima Scheda A4 (Orizzontale)</h2>
              
              {/* A4 Landscape Preview - exact replica of the image */}
              <div className="w-full aspect-[297/210] border-2 border-black bg-white shadow-lg">
                
                {/* Header Section */}
                <div className="h-[25%] flex">
                  {/* Logo Area */}
                  <div className="w-[15%] bg-teal-700 flex flex-col items-center justify-center text-white text-center">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo" 
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          console.log('Logo load error:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-sm font-bold">
                        LOGO<br/>A
                      </div>
                    )}
                  </div>

                  {/* Text Area */}
                  <div className="flex-1 px-6 py-4 flex flex-col justify-center bg-white">
                    <h1 className="text-2xl font-bold text-black uppercase mb-1">
                      CLASSE UNITA'
                    </h1>
                    <h2 className="text-xl font-bold text-black uppercase leading-tight">
                      {cardData.unit_class || 'CLASSE UNITA\''}
                    </h2>
                    <h1 className="text-2xl font-bold text-black uppercase mt-2">
                      NOME UNITA' NAVALE
                    </h1>
                    <h2 className="text-xl font-bold text-black uppercase leading-tight">
                      {cardData.name || 'NOME UNITA\' NAVALE'}
                    </h2>
                  </div>

                  {/* Flag Area */}
                  <div className="w-[15%] bg-teal-700 flex flex-col items-center justify-center text-white text-center">
                    {flagPreview ? (
                      <img 
                        src={flagPreview} 
                        alt="Flag" 
                        className="w-16 h-12 object-cover"
                        onError={(e) => {
                          console.log('Flag load error:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-sm font-bold">
                        BANDIERA<br/>NAZIONE
                      </div>
                    )}
                  </div>
                </div>

                {/* Silhouette Area */}
                <div className="h-[50%] bg-teal-700 relative flex items-center justify-center">
                  {silhouettePreview ? (
                    <img 
                      src={silhouettePreview} 
                      alt="Silhouette" 
                      className="max-w-[90%] max-h-[90%] object-contain filter brightness-0 invert"
                      style={{
                        transform: `scale(${cardData.silhouette_zoom}) translate(${cardData.silhouette_position_x}px, ${cardData.silhouette_position_y}px)`
                      }}
                      onError={(e) => {
                        console.log('Silhouette load error:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-white text-2xl font-bold">
                      SILHOUETTE NAVE
                    </div>
                  )}
                  
                  {/* Vertical dotted line in center */}
                  <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dotted border-white opacity-50"></div>
                </div>

                {/* Characteristics Table */}
                <div className="h-[25%] bg-gray-200">
                  <table className="w-full h-full border-collapse">
                    <tbody>
                      {/* Render characteristics in rows of 4 columns */}
                      {Array.from({ length: Math.max(3, Math.ceil(cardData.characteristics.length / 2)) }, (_, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-gray-400">
                          {Array.from({ length: 4 }, (_, colIndex) => {
                            const charIndex = Math.floor(rowIndex * 2 + colIndex / 2);
                            const isNameColumn = colIndex % 2 === 0;
                            const char = cardData.characteristics[charIndex];
                            
                            let content = '';
                            let bgColor = 'bg-gray-200';
                            
                            if (rowIndex === 0 && colIndex === 0) {
                              content = 'CARATTERISTICA';
                              bgColor = 'bg-gray-300';
                            } else if (rowIndex === 0 && colIndex === 1) {
                              content = 'VALORE';
                              bgColor = 'bg-gray-300';
                            } else if (rowIndex === 0 && colIndex === 2) {
                              content = char?.characteristic_name || 'RADAR 2';
                              bgColor = 'bg-gray-300';
                            } else if (rowIndex === 0 && colIndex === 3) {
                              content = char?.characteristic_value || 'XXXX';
                              bgColor = 'bg-gray-300';
                            } else if (char) {
                              if (isNameColumn) {
                                content = char.characteristic_name;
                                bgColor = colIndex === 0 ? 'bg-gray-300' : 'bg-gray-200';
                              } else {
                                content = char.characteristic_value;
                                bgColor = 'bg-gray-200';
                              }
                            } else {
                              // Default values for empty cells
                              if (rowIndex === 1 && colIndex === 0) content = 'MOTORI';
                              else if (rowIndex === 1 && colIndex === 1) content = 'XXX';
                              else if (rowIndex === 1 && colIndex === 2) content = 'MITRAGLIERA';
                              else if (rowIndex === 1 && colIndex === 3) content = 'XXX';
                              else if (rowIndex === 2 && colIndex === 0) content = 'ARMA';
                              else if (rowIndex === 2 && colIndex === 1) content = 'XXX';
                              else if (rowIndex === 2 && colIndex === 2) content = 'XXXX';
                              else if (rowIndex === 2 && colIndex === 3) content = 'XXX';
                              else if (colIndex === 0) content = 'RADAR';
                              else if (colIndex === 1) content = 'XXX';
                              else if (colIndex === 2) content = 'XXXX';
                              else content = 'XXXX';
                              
                              bgColor = colIndex % 2 === 0 ? 'bg-gray-300' : 'bg-gray-200';
                            }
                            
                            return (
                              <td 
                                key={colIndex} 
                                className={`${bgColor} border-r border-gray-400 px-2 py-1 text-xs font-medium text-black`}
                              >
                                {content}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}