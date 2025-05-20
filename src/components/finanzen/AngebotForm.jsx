// src/components/finanzen/AngebotForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { finanzenService, umzuegeService, clientService } from '../../services/api';
import { 
  extractApiData, 
  ensureArray,
  toNumber,
  validatePositions,
  calculateNettobetrag,
  calculateMwst
} from '../../utils/apiUtils';

const AngebotForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [angebot, setAngebot] = useState(null);
  const [kunden, setKunden] = useState([]);
  const [umzuege, setUmzuege] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!id;

  // Validierungsschema
  const validationSchema = Yup.object({
    kunde: Yup.string().required('Kunde ist erforderlich'),
    umzug: Yup.string(),
    gueltigBis: Yup.date().required('Gültigkeit bis ist erforderlich'),
    status: Yup.string().required('Status ist erforderlich'),
    mehrwertsteuer: Yup.number().required('Mehrwertsteuer ist erforderlich'),
    positionsliste: Yup.array().of(
      Yup.object({
        bezeichnung: Yup.string().required('Bezeichnung ist erforderlich'),
        menge: Yup.number().required('Menge ist erforderlich').positive('Menge muss positiv sein'),
        einheit: Yup.string().required('Einheit ist erforderlich'),
        einzelpreis: Yup.number().required('Einzelpreis ist erforderlich').positive('Einzelpreis muss positiv sein')
      })
    ).min(1, 'Mindestens eine Position ist erforderlich')
  });

  // Initialisierungswerte
  const initialValues = {
    kunde: '',
    umzug: '',
    gueltigBis: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    status: 'Entwurf',
    mehrwertsteuer: 19,
    positionsliste: [
      { bezeichnung: '', menge: 1, einheit: 'Stück', einzelpreis: 0, gesamtpreis: 0 }
    ],
    notizen: ''
  };

  useEffect(() => {
    // Lade Kunden und Umzüge
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Lade Kunden mit dem Service
        try {
          const kundenResponse = await clientService.getAll();
          setKunden(ensureArray(extractApiData(kundenResponse, 'clients')));
        } catch (clientError) {
          console.error('Fehler beim Laden der Kunden:', clientError);
          toast.error('Fehler beim Laden der Kundendaten');
          setKunden([]);
        }

        // Lade Umzüge mit dem Service
        try {
          const umzuegeResponse = await umzuegeService.getAll();
          setUmzuege(ensureArray(extractApiData(umzuegeResponse, 'umzuege')));
        } catch (umzuegeError) {
          console.error('Fehler beim Laden der Umzüge:', umzuegeError);
          toast.error('Fehler beim Laden der Umzugsdaten');
          setUmzuege([]);
        }

        // Wenn im Bearbeitungsmodus, lade vorhandene Angebotsdaten
        if (isEditMode) {
          try {
            const angebotResponse = await finanzenService.getAngebotById(id);
            const angebotDaten = extractApiData(angebotResponse, 'angebot');
            
            if (angebotDaten && typeof angebotDaten === 'object') {
              // Transformiere die Daten mit den Hilfsfunktionen
              const validatedAngebot = {
                ...angebotDaten,
                mehrwertsteuer: toNumber(angebotDaten.mehrwertsteuer, 19),
                positionsliste: validatePositions(
                  angebotDaten.positionsliste, 
                  (menge, einzelpreis) => (toNumber(menge) * toNumber(einzelpreis)).toFixed(2)
                )
              };
              
              setAngebot(validatedAngebot);
            } else {
              console.error('Ungültiges Angebotsdatenformat:', angebotDaten);
              toast.error('Angebot konnte nicht geladen werden: Ungültiges Format');
              setAngebot(initialValues);
            }
          } catch (angebotError) {
            console.error('Fehler beim Laden des Angebots:', angebotError);
            toast.error('Angebot konnte nicht geladen werden');
            setAngebot(initialValues);
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

  // Berechnung des Gesamtpreises für eine Position - verwendet apiUtils.toNumber
  const calculateGesamtpreis = (menge, einzelpreis) => {
    return (toNumber(menge) * toNumber(einzelpreis)).toFixed(2);
  };

  // Berechnung des Gesamtbetrags für alle Positionen - verwendet apiUtils.calculateNettobetrag und calculateMwst
  const calculateGesamtbetrag = (positionsliste, mehrwertsteuer) => {
    try {
      // Sicherstellen, dass positionsliste ein Array ist
      const positions = ensureArray(positionsliste);
      
      // Berechnung mit Hilfsfunktionen
      const nettobetrag = calculateNettobetrag(positions);
      const mwst = calculateMwst(nettobetrag, mehrwertsteuer);
      
      return (nettobetrag + mwst).toFixed(2);
    } catch (error) {
      console.error('Fehler bei Gesamtbetragsberechnung:', error);
      return '0.00';
    }
  };

  // Formular absenden
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Daten mit gemeinsamen Hilfsfunktionen validieren
      const sanitizedValues = {
        ...values,
        mehrwertsteuer: toNumber(values.mehrwertsteuer, 19),
        positionsliste: validatePositions(values.positionsliste, calculateGesamtpreis)
      };
      
      // Validierung der Pflichtfelder
      if (!sanitizedValues.kunde) {
        throw new Error('Kunde muss ausgewählt werden');
      }
      
      if (ensureArray(sanitizedValues.positionsliste).length === 0) {
        throw new Error('Mindestens eine Position muss hinzugefügt werden');
      }
      
      // API-Aufruf mit Erfolgsbehandlung
      let result;
      if (isEditMode) {
        result = await finanzenService.updateAngebot(id, sanitizedValues);
        toast.success('Angebot erfolgreich aktualisiert');
      } else {
        result = await finanzenService.createAngebot(sanitizedValues);
        toast.success('Angebot erfolgreich erstellt');
      }
      
      // Erfolgreiche Navigation
      navigate('/finanzen/angebote');
      return result;
    } catch (error) {
      console.error('Fehler beim Speichern des Angebots:', error);
      toast.error(error.message || 'Fehler beim Speichern des Angebots');
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
        {isEditMode ? 'Angebot bearbeiten' : 'Neues Angebot erstellen'}
      </h2>

      <Formik
        initialValues={angebot || initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kunde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kunde *
                </label>
                <Field
                  as="select"
                  name="kunde"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Kunde auswählen --</option>
                  {kunden.map((kunde) => (
                    <option key={kunde._id} value={kunde._id}>
                      {kunde.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="kunde" component="div" className="text-red-500 text-sm mt-1" />
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

              {/* Gültig bis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gültig bis *
                </label>
                <Field
                  type="date"
                  name="gueltigBis"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <ErrorMessage name="gueltigBis" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <Field
                  as="select"
                  name="status"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Entwurf">Entwurf</option>
                  <option value="Gesendet">Gesendet</option>
                  <option value="Akzeptiert">Akzeptiert</option>
                  <option value="Abgelehnt">Abgelehnt</option>
                </Field>
                <ErrorMessage name="status" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Mehrwertsteuer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mehrwertsteuer (%) *
                </label>
                <Field
                  type="number"
                  name="mehrwertsteuer"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <ErrorMessage name="mehrwertsteuer" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            {/* Positionsliste */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Positionen *</h3>
              <FieldArray name="positionsliste">
                {({ remove, push }) => (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bezeichnung
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Menge
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Einheit
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Einzelpreis (€)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Gesamtpreis (€)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Aktionen
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {values.positionsliste.map((position, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Field
                                  name={`positionsliste.${index}.bezeichnung`}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <ErrorMessage name={`positionsliste.${index}.bezeichnung`} component="div" className="text-red-500 text-xs mt-1" />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Field
                                  type="number"
                                  name={`positionsliste.${index}.menge`}
                                  className="block w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  onChange={(e) => {
                                    // Sichere Konvertierung in eine Zahl
                                    const value = e.target.value;
                                    const numValue = parseFloat(value) || 0;
                                    
                                    // Update des Feldes mit dem validierten Wert
                                    setFieldValue(`positionsliste.${index}.menge`, numValue);
                                    
                                    // Berechne Gesamtpreis mit sicheren Werten
                                    const einzelpreis = parseFloat(values.positionsliste[index].einzelpreis) || 0;
                                    const gesamtpreis = calculateGesamtpreis(numValue, einzelpreis);
                                    setFieldValue(`positionsliste.${index}.gesamtpreis`, gesamtpreis);
                                  }}
                                />
                                <ErrorMessage name={`positionsliste.${index}.menge`} component="div" className="text-red-500 text-xs mt-1" />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Field
                                  as="select"
                                  name={`positionsliste.${index}.einheit`}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="Stück">Stück</option>
                                  <option value="Stunde">Stunde</option>
                                  <option value="Tag">Tag</option>
                                  <option value="Pauschale">Pauschale</option>
                                  <option value="km">km</option>
                                </Field>
                                <ErrorMessage name={`positionsliste.${index}.einheit`} component="div" className="text-red-500 text-xs mt-1" />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Field
                                  type="number"
                                  name={`positionsliste.${index}.einzelpreis`}
                                  className="block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  onChange={(e) => {
                                    // Sichere Konvertierung in eine Zahl
                                    const value = e.target.value;
                                    const numValue = parseFloat(value) || 0;
                                    
                                    // Update des Feldes mit dem validierten Wert
                                    setFieldValue(`positionsliste.${index}.einzelpreis`, numValue);
                                    
                                    // Berechne Gesamtpreis mit sicheren Werten
                                    const menge = parseFloat(values.positionsliste[index].menge) || 0;
                                    const gesamtpreis = calculateGesamtpreis(menge, numValue);
                                    setFieldValue(`positionsliste.${index}.gesamtpreis`, gesamtpreis);
                                  }}
                                />
                                <ErrorMessage name={`positionsliste.${index}.einzelpreis`} component="div" className="text-red-500 text-xs mt-1" />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {calculateGesamtpreis(
                                  values.positionsliste[index].menge,
                                  values.positionsliste[index].einzelpreis
                                )} €
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {values.positionsliste.length > 1 && (
                                  <button
                                    type="button"
                                    className="text-red-600 hover:text-red-800"
                                    onClick={() => remove(index)}
                                  >
                                    Entfernen
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => push({ bezeichnung: '', menge: 1, einheit: 'Stück', einzelpreis: 0, gesamtpreis: 0 })}
                    >
                      Position hinzufügen
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            {/* Gesamtbetrag */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Nettobetrag</p>
                  <p className="text-lg font-medium text-gray-900">
                    {(() => {
                      try {
                        // Sicherstellen, dass positionsliste ein Array ist und alle Werte Zahlen sind
                        if (!Array.isArray(values.positionsliste)) return '0.00';
                        
                        const nettobetrag = values.positionsliste.reduce((sum, pos) => {
                          const menge = parseFloat(pos.menge) || 0;
                          const einzelpreis = parseFloat(pos.einzelpreis) || 0;
                          return sum + (menge * einzelpreis);
                        }, 0);
                        
                        return nettobetrag.toFixed(2);
                      } catch (e) {
                        console.error('Fehler bei der Berechnung des Nettobetrags:', e);
                        return '0.00';
                      }
                    })()} €
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Mehrwertsteuer ({parseFloat(values.mehrwertsteuer) || 0}%)</p>
                  <p className="text-lg font-medium text-gray-900">
                    {(() => {
                      try {
                        // Sicherstellen, dass positionsliste ein Array ist und alle Werte Zahlen sind
                        if (!Array.isArray(values.positionsliste)) return '0.00';
                        
                        const nettobetrag = values.positionsliste.reduce((sum, pos) => {
                          const menge = parseFloat(pos.menge) || 0;
                          const einzelpreis = parseFloat(pos.einzelpreis) || 0;
                          return sum + (menge * einzelpreis);
                        }, 0);
                        
                        const mwstRate = parseFloat(values.mehrwertsteuer) || 0;
                        const mwst = nettobetrag * (mwstRate / 100);
                        
                        return mwst.toFixed(2);
                      } catch (e) {
                        console.error('Fehler bei der Berechnung der Mehrwertsteuer:', e);
                        return '0.00';
                      }
                    })()} €
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Gesamtbetrag</p>
                  <p className="text-xl font-bold text-gray-900">
                    {calculateGesamtbetrag(values.positionsliste, values.mehrwertsteuer)} €
                  </p>
                </div>
              </div>
            </div>

            {/* Notizen */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notizen
              </label>
              <Field
                as="textarea"
                name="notizen"
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => navigate('/finanzen/angebote')}
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

export default AngebotForm;