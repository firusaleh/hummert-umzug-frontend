// Import-Statements für API hinzufügen
import { umzugsaufnahmeService } from '../../services/api';

// Im Komponenten-Code, initialData-Laden anpassen
useEffect(() => {
  const loadFormularData = async () => {
    // Wenn initialData als ID übergeben wird
    if (initialData && typeof initialData === 'string') {
      try {
        const response = await umzugsaufnahmeService.getById(initialData);
        setFormData(response.data);
      } catch (error) {
        console.error('Fehler beim Laden der Umzugsaufnahme:', error);
      }
    } else if (initialData) {
      // Wenn initialData direkt als Objekt übergeben wird
      setFormData(prevData => ({
        ...prevData,
        ...initialData,
      }));
    }
  };
  
  loadFormularData();
}, [initialData]);

// Bilder-Upload für Inventaritems
const handleAddPhoto = async (itemId) => {
  // Erstelle einen unsichtbaren Datei-Input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  
  fileInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    
    try {
      // Wenn wir bereits eine gespeicherte Umzugsaufnahme haben und das Item eine ID hat
      if (formData.id && itemId) {
        // Bilder zum Server hochladen
        await umzugsaufnahmeService.uploadBilder(formData.id, itemId, files);
        
        // Optimistische UI-Aktualisierung
        const newPhotos = files.map(file => URL.createObjectURL(file));
        
        setFormData(prevData => ({
          ...prevData,
          inventarItems: prevData.inventarItems.map(item => 
            item.id === itemId ? 
              { ...item, fotos: [...item.fotos, ...newPhotos] } : 
              item
          )
        }));
      } else {
        // Noch nicht gespeicherte Umzugsaufnahme - nur lokale Vorschau zeigen
        const newPhotos = files.map(file => ({
          url: URL.createObjectURL(file),
          file: file // Original-Datei für späteren Upload speichern
        }));
        
        setFormData(prevData => ({
          ...prevData,
          inventarItems: prevData.inventarItems.map(item => 
            item.id === itemId ? 
              { ...item, fotos: [...item.fotos, ...newPhotos] } : 
              item
          )
        }));
      }
    } catch (error) {
      console.error('Fehler beim Hochladen der Bilder:', error);
      alert('Fehler beim Hochladen der Bilder');
    }
  };
  
  fileInput.click();
};

// Formular speichern
const handleSubmit = async () => {
  try {
    let responseData;
    
    if (formData.id) {
      // Bestehende Umzugsaufnahme aktualisieren
      const response = await umzugsaufnahmeService.update(formData.id, formData);
      responseData = response.data;
    } else {
      // Neue Umzugsaufnahme erstellen
      const response = await umzugsaufnahmeService.save(formData);
      responseData = response.data;
      
      // Für jedes Item mit temporären Fotos diese hochladen
      for (const item of formData.inventarItems) {
        if (item.fotos && item.fotos.some(foto => foto.file)) {
          const filesToUpload = item.fotos
            .filter(foto => foto.file)
            .map(foto => foto.file);
            
          if (filesToUpload.length > 0) {
            await umzugsaufnahmeService.uploadBilder(
              responseData.id, 
              item.id, 
              filesToUpload
            );
          }
        }
      }
    }
    
    // Callback mit den gespeicherten Daten aufrufen
    onSave(responseData);
  } catch (error) {
    console.error('Fehler beim Speichern der Umzugsaufnahme:', error);
    alert('Fehler beim Speichern der Umzugsaufnahme');
  }
};