// src/components/finanzen/RechnungForm.jsx
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

const RechnungForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rechnung, setRechnung] = useState(null);
  const [kunden, setKunden] = useState([]);
  const [umzuege, setUmzuege] = useState([]);
  const [angebote, setAngebote] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!id;

  // Validierungsschema
  const validationSchema = Yup.object({
    kunde: Yup.string().required('Kunde ist erforderlich'),
    umzug: Yup.string(),
    angebot: Yup.string(),
    faelligkeitsdatum: Yup.date().required('Fälligkeitsdatum ist erforderlich'),
    status: Yup.string().required('Status ist erforderlich'),
    zahlungsmethode: Yup.string().required('Zahlungsmethode ist erforderlich'),
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
    angebot: '',
    ausstellungsdatum: dayjs().format('YYYY-MM-DD'),
    faelligkeitsdatum: dayjs().add(14, 'day').format('YYYY-MM-DD'),
    status: 'Entwurf',
    zahlungsmethode: 'Überweisung',
    mehrwertsteuer: 19,
    positionsliste: [
      { bezeichnung: '', menge: 1, einheit: 'Stück', einzelpreis: 0, gesamtpreis: 0 }
    ],
    notizen: ''
  };

  useEffect(() => {
    // Lade Kunden, Umzüge und Angebote
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

        // Lade Angebote mit dem Service
        try {
          const angeboteResponse = await finanzenService.getAngebote();
          setAngebote(ensureArray(extractApiData(angeboteResponse, 'angebote')));
        } catch (angeboteError) {
          console.error('Fehler beim Laden der Angebote:', angeboteError);
          toast.error('Fehler beim Laden der Angebotsdaten');
          setAngebote([]);
        }

        // Wenn im Bearbeitungsmodus, lade vorhandene Rechnungsdaten
        if (isEditMode) {
          try {
            const rechnungResponse = await finanzenService.getRechnungById(id);
            const rechnungDaten = extractApiData(rechnungResponse, 'rechnung');
            
            if (rechnungDaten && typeof rechnungDaten === 'object') {
              // Transformiere die Daten mit den Hilfsfunktionen
              const validatedRechnung = {
                ...rechnungDaten,
                mehrwertsteuer: toNumber(rechnungDaten.mehrwertsteuer, 19),
                positionsliste: validatePositions(
                  rechnungDaten.positionsliste, 
                  (menge, einzelpreis) => (toNumber(menge) * toNumber(einzelpreis)).toFixed(2)
                )
              };
              
              setRechnung(validatedRechnung);
            } else {
              console.error('Ungültiges Rechnungsdatenformat:', rechnungDaten);
              toast.error('Rechnung konnte nicht geladen werden: Ungültiges Format');
              setRechnung(initialValues);
            }
          } catch (rechnungError) {
            console.error('Fehler beim Laden der Rechnung:', rechnungError);
            toast.error('Rechnung konnte nicht geladen werden');
            setRechnung(initialValues);
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

  // Lade Angebotsdaten, wenn ein Angebot ausgewählt wird
  const handleAngebotChange = async (angebotId, setFieldValue) => {
    if (!angebotId) return;

    try {
      const angebotResponse = await finanzenService.getAngebotById(angebotId);
      const angebot = extractApiData(angebotResponse, 'angebot');
      
      if (!angebot || typeof angebot !== 'object') {
        throw new Error('Angebot hat ein ungültiges Format');
      }
      
      // Formularfelder mit validierten Daten setzen
      try {
        // Kunde ID mit Validierung 
        if (angebot.kunde) {
          const kundeId = angebot.kunde._id || angebot.kunde;
          setFieldValue('kunde', kundeId);
        }
        
        // Umzug ID mit Validierung
        if (angebot.umzug) {
          const umzugId = angebot.umzug._id || angebot.umzug;
          setFieldValue('umzug', umzugId);
        } else {
          setFieldValue('umzug', '');
        }
        
        // Mehrwertsteuer mit sicherer Konvertierung
        setFieldValue('mehrwertsteuer', toNumber(angebot.mehrwertsteuer, 19));
        
        // Positionsliste mit zentraler Validierungsfunktion
        const validPositions = validatePositions(angebot.positionsliste, calculateGesamtpreis);
        setFieldValue('positionsliste', validPositions);
        
        toast.success('Angebotsdaten übernommen');
      } catch (parseError) {
        console.error('Fehler beim Verarbeiten der Angebotsdaten:', parseError);
        toast.error('Fehler beim Verarbeiten des Angebots');
      }
    } catch (error) {
      console.error('Fehler beim Laden des Angebots:', error);
      toast.error(error.message || 'Fehler beim Laden des Angebots');
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
        result = await finanzenService.updateRechnung(id, sanitizedValues);
        toast.success('Rechnung erfolgreich aktualisiert');
      } else {
        result = await finanzenService.createRechnung(sanitizedValues);
        toast.success('Rechnung erfolgreich erstellt');
      }
      
      // Erfolgreiche Navigation
      navigate('/finanzen/rechnungen');
      return result;
    } catch (error) {
      console.error('Fehler beim Speichern der Rechnung:', error);
      toast.error(error.message || 'Fehler beim Speichern der Rechnung');
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
        {isEditMode ? 'Rechnung bearbeiten' : 'Neue Rechnung erstellen'}
      </h2>

      <Formik
        initialValues={rechnung || initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Angebot (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aus Angebot erstellen (optional)
                </label>
                <Field
                  as="select"
                  name="angebot"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => {
                    const value = e.target.value;
                    setFieldValue('angebot', value);
                    handleAngebotChange(value, setFieldValue);
                  }}
                >
                  <option value="">-- Angebot auswählen --</option>
                  {angebote.map((angebot) => (
                    <option key={angebot._id} value={angebot._id}>
                      {angebot.angebotNummer} - {angebot.kunde?.name || 'Unbekannter Kunde'}
                    </option>
                  ))}
                </Field>
              </div>

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

              {/* Ausstellungsdatum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ausstellungsdatum *
                </label>
                <Field
                  type="date"
                  name="ausstellungsdatum"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <ErrorMessage name="ausstellungsdatum" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Fälligkeitsdatum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fälligkeitsdatum *
                </label>
                <Field
                  type="date"
                  name="faelligkeitsdatum"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <ErrorMessage name="faelligkeitsdatum" component="div" className="text-red-500 text-sm mt-1" />
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
                  <option value="Teilweise bezahlt">Teilweise bezahlt</option>
                  <option value="Bezahlt">Bezahlt</option>
                  <option value="Überfällig">Überfällig</option>
                  <option value="Storniert">Storniert</option>
                </Field>
                <ErrorMessage name="status" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Zahlungsmethode */}
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
                onClick={() => navigate('/finanzen/rechnungen')}
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

export default RechnungForm;