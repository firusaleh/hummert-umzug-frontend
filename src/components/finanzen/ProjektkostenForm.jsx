// src/components/finanzen/ProjektkostenForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { finanzenService, umzuegeService, fileService } from '../../services/api';
import { 
  extractApiData, 
  ensureArray, 
  toNumber,
  safeJsonParse
} from '../../utils/apiUtils';

const ProjektkostenForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projektkosten, setProjektkosten] = useState(null);
  const [umzuege, setUmzuege] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const isEditMode = !!id;

  // Validierungsschema
  const validationSchema = Yup.object({
    bezeichnung: Yup.string().required('Bezeichnung ist erforderlich'),
    umzug: Yup.string(),
    kategorie: Yup.string().required('Kategorie ist erforderlich'),
    betrag: Yup.number().required('Betrag ist erforderlich').positive('Betrag muss positiv sein'),
    datum: Yup.date().required('Datum ist erforderlich'),
    beschreibung: Yup.string(),
    bezahlstatus: Yup.string().required('Bezahlstatus ist erforderlich'),
    zahlungsmethode: Yup.string().when('bezahlstatus', {
      is: 'Bezahlt',
      then: () => Yup.string().required('Zahlungsmethode ist erforderlich')
    })
  });

  // Initialisierungswerte
  const initialValues = {
    bezeichnung: '',
    umzug: '',
    kategorie: 'Material',
    betrag: '',
    datum: dayjs().format('YYYY-MM-DD'),
    beschreibung: '',
    bezahlstatus: 'Offen',
    bezahltAm: '',
    zahlungsmethode: 'Überweisung'
  };

  useEffect(() => {
    // Lade Umzüge und ggf. Projektkosten
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Lade Umzüge mit dem Service
        try {
          const umzuegeResponse = await umzuegeService.getAll();
          setUmzuege(ensureArray(extractApiData(umzuegeResponse, 'umzuege')));
        } catch (umzuegeError) {
          console.error('Fehler beim Laden der Umzüge:', umzuegeError);
          toast.error('Fehler beim Laden der Umzugsdaten');
          setUmzuege([]);
        }

        // Wenn im Bearbeitungsmodus, lade vorhandene Projektkosten
        if (isEditMode) {
          try {
            const projektkostenResponse = await finanzenService.getProjektkostenById(id);
            const projektkostenDaten = extractApiData(projektkostenResponse, 'projektkosten');
            
            if (projektkostenDaten && typeof projektkostenDaten === 'object') {
              // Transformiere die Daten für die Konsistenz
              const validatedProjektkosten = {
                ...projektkostenDaten,
                betrag: toNumber(projektkostenDaten.betrag, 0),
                // Stelle sicher, dass das Datumsformat korrekt ist
                datum: projektkostenDaten.datum ? dayjs(projektkostenDaten.datum).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                bezahltAm: projektkostenDaten.bezahltAm ? dayjs(projektkostenDaten.bezahltAm).format('YYYY-MM-DD') : ''
              };
              
              setProjektkosten(validatedProjektkosten);
              
              // Setze hochgeladene Dateien mit Fehlerbehandlung
              if (projektkostenDaten.belege) {
                setUploadedFiles(ensureArray(projektkostenDaten.belege));
              }
            } else {
              console.error('Ungültiges Projektkostendatenformat:', projektkostenDaten);
              toast.error('Projektkosten konnten nicht geladen werden: Ungültiges Format');
              setProjektkosten(initialValues);
            }
          } catch (projektkostenError) {
            console.error('Fehler beim Laden der Projektkosten:', projektkostenError);
            toast.error('Projektkosten konnten nicht geladen werden');
            setProjektkosten(initialValues);
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        toast.error('Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  // Datei-Upload-Handler
  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  // Upload-Funktion mit verbesserter Fehlerbehandlung
  const uploadBelege = async (projektkostenId) => {
    if (!selectedFiles.length) return [];

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      formData.append('category', 'Projektkosten');
      formData.append('reference', projektkostenId);

      const uploadResponse = await fileService.uploadFile(formData);
      return ensureArray(extractApiData(uploadResponse, 'files'));
    } catch (error) {
      console.error('Fehler beim Hochladen der Belege:', error);
      toast.error(error.message || 'Fehler beim Hochladen der Belege');
      return [];
    }
  };

  // Formular absenden mit verbesserter Fehlerbehandlung
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Daten mit gemeinsamen Hilfsfunktionen validieren
      const sanitizedValues = {
        ...values,
        betrag: toNumber(values.betrag, 0)
      };
      
      // Validierung der Pflichtfelder
      if (!sanitizedValues.bezeichnung) {
        throw new Error('Bezeichnung muss angegeben werden');
      }
      
      // API-Aufruf mit Erfolgsbehandlung
      let result;
      if (isEditMode) {
        result = await finanzenService.updateProjektkosten(id, sanitizedValues);
        toast.success('Projektkosten erfolgreich aktualisiert');
      } else {
        result = await finanzenService.createProjektkosten(sanitizedValues);
        toast.success('Projektkosten erfolgreich erstellt');
      }
      
      // Belege hochladen, wenn vorhanden
      if (selectedFiles.length > 0) {
        const projektkostenData = extractApiData(result, 'projektkosten');
        const projektkostenId = isEditMode ? id : (projektkostenData?._id || '');
        
        if (!projektkostenId) {
          console.warn('Keine Projektkosten-ID für Belegupload verfügbar');
          toast.warning('Projektkosten gespeichert, aber Belege konnten nicht zugeordnet werden');
        } else {
          await uploadBelege(projektkostenId);
        }
      }
      
      // Erfolgreiche Navigation
      navigate('/finanzen/projektkosten');
    } catch (error) {
      console.error('Fehler beim Speichern der Projektkosten:', error);
      toast.error(error.message || 'Fehler beim Speichern der Projektkosten');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6">
        {isEditMode ? 'Projektkosten bearbeiten' : 'Neue Projektkosten erfassen'}
      </h2>

      <Formik
        initialValues={projektkosten || initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bezeichnung */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bezeichnung *
                </label>
                <Field
                  type="text"
                  name="bezeichnung"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <ErrorMessage name="bezeichnung" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Umzug (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Umzug (optional)
                </label>
                <Field
                  as="select"
                  name="umzug"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Umzug auswählen --</option>
                  {umzuege.map((umzug) => (
                    <option key={umzug._id} value={umzug._id}>
                      {umzug.bezeichnung}
                    </option>
                  ))}
                </Field>
              </div>

              {/* Kategorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie *
                </label>
                <Field
                  as="select"
                  name="kategorie"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Personal">Personal</option>
                  <option value="Fahrzeuge">Fahrzeuge</option>
                  <option value="Material">Material</option>
                  <option value="Unterauftrag">Unterauftrag</option>
                  <option value="Sonstiges">Sonstiges</option>
                </Field>
                <ErrorMessage name="kategorie" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Betrag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betrag (€) *
                </label>
                <Field
                  type="number"
                  name="betrag"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <ErrorMessage name="betrag" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Datum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum *
                </label>
                <Field
                  type="date"
                  name="datum"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <ErrorMessage name="datum" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Bezahlstatus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bezahlstatus *
                </label>
                <Field
                  as="select"
                  name="bezahlstatus"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const value = e.target.value;
                    setFieldValue('bezahlstatus', value);
                    
                    // Wenn "Bezahlt" ausgewählt wird, setze Bezahldatum auf heute
                    if (value === 'Bezahlt' && !values.bezahltAm) {
                      setFieldValue('bezahltAm', dayjs().format('YYYY-MM-DD'));
                    }
                  }}
                >
                  <option value="Offen">Offen</option>
                  <option value="Bezahlt">Bezahlt</option>
                  <option value="Storniert">Storniert</option>
                </Field>
                <ErrorMessage name="bezahlstatus" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Bezahldatum (nur anzeigen, wenn Status "Bezahlt" ist) */}
              {values.bezahlstatus === 'Bezahlt' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bezahlt am *
                  </label>
                  <Field
                    type="date"
                    name="bezahltAm"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <ErrorMessage name="bezahltAm" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              )}

              {/* Zahlungsmethode (nur anzeigen, wenn Status "Bezahlt" ist) */}
              {values.bezahlstatus === 'Bezahlt' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zahlungsmethode *
                  </label>
                  <Field
                    as="select"
                    name="zahlungsmethode"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Überweisung">Überweisung</option>
                    <option value="Bar">Bar</option>
                    <option value="Kreditkarte">Kreditkarte</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Sonstige">Sonstige</option>
                  </Field>
                  <ErrorMessage name="zahlungsmethode" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              )}
            </div>

            {/* Beschreibung */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <Field
                as="textarea"
                name="beschreibung"
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Belege */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Belege hochladen
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Unterstützte Formate: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
              </p>
            </div>

            {/* Bereits hochgeladene Belege */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Bereits hochgeladene Belege:</h3>
                <ul className="border rounded-md divide-y divide-gray-200">
                  {uploadedFiles.map((file) => (
                    <li key={file._id} className="p-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="ml-2 text-sm text-gray-700">{file.originalName}</span>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-800 mr-3"
                          onClick={() => window.open(`/api/files/download/${file._id}`, '_blank')}
                        >
                          Herunterladen
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => navigate('/finanzen/projektkosten')}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSubmitting ? 'Wird gespeichert...' : (isEditMode ? 'Aktualisieren' : 'Speichern')}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ProjektkostenForm;