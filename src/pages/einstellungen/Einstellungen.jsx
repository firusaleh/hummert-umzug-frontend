// src/pages/einstellungen/Einstellungen.jsx
import React, { useState } from 'react';
import { 
  Save, 
  User, 
  Lock, 
  Bell, 
  Settings as SettingsIcon, 
  Mail, 
  Globe,
  Check
} from 'lucide-react';

const Einstellungen = () => {
  // State für verschiedene Einstellungen
  const [userSettings, setUserSettings] = useState({
    // Persönliche Daten
    vorname: '',
    nachname: '',
    email: '',
    sprache: 'de',
    
    // Benachrichtigungen
    emailBenachrichtigungen: true,
    browserBenachrichtigungen: true,
    täglicheZusammenfassung: false,
    
    // Darstellung
    darkMode: false,
    farbschema: 'blau',
    schriftgröße: 'mittel'
  });
  
  const [passwordData, setPasswordData] = useState({
    aktuellesPasswort: '',
    neuesPasswort: '',
    neuesPasswortWiederholen: ''
  });
  
  const [successMessage, setSuccessMessage] = useState('');

  // Handler für Textfeld-Änderungen
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handler für Passwortfeld-Änderungen
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Benutzerdaten speichern
  const handleSaveUserSettings = async (e) => {
    e.preventDefault();
    
    try {
      // Hier würde ein API-Aufruf stattfinden
      // await api.updateUserSettings(userSettings);
      
      setSuccessMessage('Einstellungen wurden erfolgreich gespeichert.');
      
      // Erfolgsmeldung nach 3 Sekunden ausblenden
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      setSuccessMessage('Fehler beim Speichern der Einstellungen.');
    }
  };

  // Passwort ändern
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Einfache Validierung
    if (passwordData.neuesPasswort !== passwordData.neuesPasswortWiederholen) {
      setSuccessMessage('Die Passwörter stimmen nicht überein.');
      return;
    }
    
    // Stärkere Passwortvalidierung
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(passwordData.neuesPasswort)) {
      setSuccessMessage('Das Passwort muss mindestens 12 Zeichen lang sein und Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen enthalten.');
      return;
    }
    
    try {
      // Hier würde ein API-Aufruf stattfinden
      // await api.changePassword(passwordData);
      
      // Formular zurücksetzen
      setPasswordData({
        aktuellesPasswort: '',
        neuesPasswort: '',
        neuesPasswortWiederholen: ''
      });
      
      setSuccessMessage('Passwort wurde erfolgreich geändert.');
    } catch (error) {
      setSuccessMessage('Fehler beim Ändern des Passworts.');
    }
    
    // Erfolgsmeldung nach 3 Sekunden ausblenden
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Einstellungen</h1>
      </div>
      
      {/* Erfolgsmeldung */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <Check size={20} className="mr-2" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Persönliche Daten */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <div className="flex items-center mb-4 border-b pb-2">
            <User size={20} className="mr-2 text-blue-500" />
            <h2 className="text-lg font-semibold">Persönliche Daten</h2>
          </div>
          
          <form onSubmit={handleSaveUserSettings}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                <input
                  type="text"
                  name="vorname"
                  value={userSettings.vorname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
                <input
                  type="text"
                  name="nachname"
                  value={userSettings.nachname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail-Adresse</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={userSettings.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sprache</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe size={16} className="text-gray-400" />
                </div>
                <select
                  name="sprache"
                  value={userSettings.sprache}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">Englisch</option>
                  <option value="fr">Französisch</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Save size={16} className="mr-2" /> Speichern
              </button>
            </div>
          </form>
        </div>
        
        {/* Passwort ändern */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4 border-b pb-2">
            <Lock size={20} className="mr-2 text-blue-500" />
            <h2 className="text-lg font-semibold">Passwort ändern</h2>
          </div>
          
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aktuelles Passwort</label>
                <input
                  type="password"
                  name="aktuellesPasswort"
                  value={passwordData.aktuellesPasswort}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
                <input
                  type="password"
                  name="neuesPasswort"
                  value={passwordData.neuesPasswort}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mindestens 12 Zeichen, mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passwort wiederholen</label>
                <input
                  type="password"
                  name="neuesPasswortWiederholen"
                  value={passwordData.neuesPasswortWiederholen}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center"
                >
                  <Lock size={16} className="mr-2" /> Passwort ändern
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {/* Benachrichtigungseinstellungen */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4 border-b pb-2">
            <Bell size={20} className="mr-2 text-blue-500" />
            <h2 className="text-lg font-semibold">Benachrichtigungen</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">E-Mail-Benachrichtigungen</p>
                <p className="text-xs text-gray-500">Benachrichtigungen per E-Mail erhalten</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="emailBenachrichtigungen"
                  checked={userSettings.emailBenachrichtigungen}
                  onChange={handleInputChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Browser-Benachrichtigungen</p>
                <p className="text-xs text-gray-500">Benachrichtigungen im Browser anzeigen</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="browserBenachrichtigungen"
                  checked={userSettings.browserBenachrichtigungen}
                  onChange={handleInputChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Tägliche Zusammenfassung</p>
                <p className="text-xs text-gray-500">Tägliche Zusammenfassung der Aktivitäten erhalten</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="täglicheZusammenfassung"
                  checked={userSettings.täglicheZusammenfassung}
                  onChange={handleInputChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Darstellungseinstellungen */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <div className="flex items-center mb-4 border-b pb-2">
            <SettingsIcon size={20} className="mr-2 text-blue-500" />
            <h2 className="text-lg font-semibold">Darstellung</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farbschema</label>
              <select
                name="farbschema"
                value={userSettings.farbschema}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="blau">Blau</option>
                <option value="grün">Grün</option>
                <option value="lila">Lila</option>
                <option value="rot">Rot</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schriftgröße</label>
              <select
                name="schriftgröße"
                value={userSettings.schriftgröße}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="klein">Klein</option>
                <option value="mittel">Mittel</option>
                <option value="groß">Groß</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between col-span-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                <p className="text-xs text-gray-500">Dunkles Erscheinungsbild der Anwendung</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="darkMode"
                  checked={userSettings.darkMode}
                  onChange={handleInputChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="col-span-2 flex justify-end mt-4">
              <button 
                onClick={handleSaveUserSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Save size={16} className="mr-2" /> Einstellungen speichern
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* System-Informationen */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4 border-b pb-2">
          <SettingsIcon size={20} className="mr-2 text-blue-500" />
          <h2 className="text-lg font-semibold">System-Informationen</h2>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Anwendungsversion:</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Letztes Update:</span>
            <span className="text-sm font-medium">06.05.2025</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Browser:</span>
            <span className="text-sm font-medium">Chrome 120.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Betriebssystem:</span>
            <span className="text-sm font-medium">Windows 11</span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 Hummert Umzug. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Einstellungen;