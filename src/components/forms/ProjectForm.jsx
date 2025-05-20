// src/components/forms/ProjectForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService, clientService } from '../../services/api';
import { toast } from 'react-toastify';

const ProjectForm = ({ project, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    startDate: '',
    endDate: '',
    status: 'geplant'
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to extract API data
  const extractApiData = (response) => {
    if (!response) return null;
    if (response.data) return response.data;
    if (response.success && response.data) return response.data;
    return response;
  };

  // Helper function to ensure we have an array
  const ensureArray = (data) => {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  };

  useEffect(() => {
    // Clients laden
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await clientService.getAll();
        const clientsData = extractApiData(response);
        setClients(ensureArray(clientsData));
        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Clients');
        console.error('Fehler beim Laden der Clients:', err);
        toast.error('Clients konnten nicht geladen werden');
        setLoading(false);
      }
    };

    fetchClients();

    // Wenn ein Projekt zum Bearbeiten übergeben wurde, Formular mit den Projektdaten füllen
    if (isEditing && project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        client: project.client?._id || project.client || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().substr(0, 10) : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().substr(0, 10) : '',
        status: project.status || 'geplant'
      });
    }
  }, [isEditing, project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (isEditing && project?._id) {
        response = await projectService.update(project._id, formData);
      } else {
        response = await projectService.create(formData);
      }
      
      if (response.success === false) {
        throw new Error(response.message || 'Fehler beim Speichern des Projekts');
      }
      
      toast.success(isEditing ? 'Projekt erfolgreich aktualisiert' : 'Projekt erfolgreich erstellt');
      navigate('/projects');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      console.error('Fehler beim Speichern des Projekts:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Projektname *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        ></textarea>
      </div>

      <div>
        <label htmlFor="client" className="block text-sm font-medium text-gray-700">
          Client *
        </label>
        <select
          id="client"
          name="client"
          value={formData.client}
          onChange={handleChange}
          required
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Client auswählen</option>
          {clients.map(client => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Startdatum *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            Enddatum
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="geplant">Geplant</option>
          <option value="in Bearbeitung">In Bearbeitung</option>
          <option value="pausiert">Pausiert</option>
          <option value="abgeschlossen">Abgeschlossen</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="mr-2 bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Wird gespeichert...' : isEditing ? 'Aktualisieren' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;