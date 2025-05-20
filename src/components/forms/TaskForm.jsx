// src/components/forms/TaskForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService, projectService, userService } from '../../services/api';
import { toast } from 'react-toastify';

const TaskForm = ({ task, projectId, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: projectId || '',
    assignedTo: '',
    status: 'offen',
    priority: 'mittel',
    dueDate: ''
  });
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
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
    // Projekte und Benutzer laden
    const fetchData = async () => {
      try {
        setLoading(true);

        // Use Promise.allSettled for better error handling with multiple requests
        const [projectsResult, usersResult] = await Promise.allSettled([
          projectService.getAll(),
          userService.getAll()
        ]);

        // Handle projects data
        if (projectsResult.status === 'fulfilled') {
          const projectsData = extractApiData(projectsResult.value);
          setProjects(ensureArray(projectsData));
        } else {
          console.error('Fehler beim Laden der Projekte:', projectsResult.reason);
          toast.error('Projekte konnten nicht geladen werden');
        }

        // Handle users data
        if (usersResult.status === 'fulfilled') {
          const usersData = extractApiData(usersResult.value);
          setUsers(ensureArray(usersData));
        } else {
          console.error('Fehler beim Laden der Benutzer:', usersResult.reason);
          toast.error('Benutzer konnten nicht geladen werden');
        }

        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Daten');
        console.error(err);
        toast.error('Fehler beim Laden der Formulardaten');
        setLoading(false);
      }
    };

    fetchData();

    // Wenn eine Aufgabe zum Bearbeiten übergeben wurde, Formular mit den Aufgabendaten füllen
    if (isEditing && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        project: task.project?._id || task.project || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        status: task.status || 'offen',
        priority: task.priority || 'mittel',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().substr(0, 10) : ''
      });
    }
  }, [isEditing, task, projectId]);

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
      
      if (isEditing && task?._id) {
        response = await taskService.update(task._id, formData);
      } else {
        response = await taskService.create(formData);
      }
      
      if (response.success === false) {
        throw new Error(response.message || 'Fehler beim Speichern der Aufgabe');
      }
      
      toast.success(isEditing ? 'Aufgabe erfolgreich aktualisiert' : 'Aufgabe erfolgreich erstellt');
      navigate(projectId ? `/projects/${projectId}` : '/tasks');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Ein Fehler ist aufgetreten';
      setError(errorMessage);
      console.error('Fehler beim Speichern der Aufgabe:', err);
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Aufgabentitel *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
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

      {!projectId && (
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700">
            Projekt *
          </label>
          <select
            id="project"
            name="project"
            value={formData.project}
            onChange={handleChange}
            required
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Projekt auswählen</option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
          Zugewiesen an
        </label>
        <select
          id="assignedTo"
          name="assignedTo"
          value={formData.assignedTo}
          onChange={handleChange}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Niemandem zugewiesen</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.username}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <option value="offen">Offen</option>
            <option value="in Bearbeitung">In Bearbeitung</option>
            <option value="Review">Review</option>
            <option value="abgeschlossen">Abgeschlossen</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priorität
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="niedrig">Niedrig</option>
            <option value="mittel">Mittel</option>
            <option value="hoch">Hoch</option>
            <option value="kritisch">Kritisch</option>
          </select>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            Fälligkeitsdatum
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate(projectId ? `/projects/${projectId}` : '/tasks')}
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

export default TaskForm;