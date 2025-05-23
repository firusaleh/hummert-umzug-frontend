// src/components/forms/ClientForm.fixed.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import api from '../../services/api';
import { validationUtils } from '../../services/utils';
import PropTypes from 'prop-types';

const ClientForm = ({ client, isEditing = false, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form values
  const initialValues = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      zipCode: '',
      country: 'Deutschland'
    }
  };

  // Form validation rules
  const validationRules = {
    name: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Clientname ist erforderlich';
      }
      if (value.length < 2) {
        return 'Clientname muss mindestens 2 Zeichen lang sein';
      }
      return null;
    },
    email: (value) => {
      if (value && !validationUtils.isValidEmail(value)) {
        return 'Ungültige E-Mail-Adresse';
      }
      return null;
    },
    phone: (value) => {
      if (value && !validationUtils.isValidPhoneNumber(value)) {
        return 'Ungültige Telefonnummer';
      }
      return null;
    },
    'address.zipCode': (value) => {
      if (value && !validationUtils.isValidGermanZipCode(value)) {
        return 'Ungültige Postleitzahl (5 Ziffern)';
      }
      return null;
    }
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setFieldValue,
    resetForm
  } = useForm(initialValues, validationRules);

  // Load client data when editing
  useEffect(() => {
    if (isEditing && client) {
      setValues({
        name: client.name || '',
        contactPerson: client.contactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        address: {
          street: client.address?.street || '',
          city: client.address?.city || '',
          zipCode: client.address?.zipCode || '',
          country: client.address?.country || 'Deutschland'
        }
      });
    }
  }, [isEditing, client, setValues]);

  // Format phone number as user types
  const handlePhoneChange = (e) => {
    const { value } = e.target;
    const formattedValue = validationUtils.formatPhoneNumber(value);
    setFieldValue('phone', formattedValue);
  };

  // Handle form submission
  const onSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...values,
        phone: values.phone ? validationUtils.normalizePhoneNumber(values.phone) : ''
      };

      const response = isEditing
        ? await api.client.update(client._id, payload)
        : await api.client.create(payload);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        } else {
          navigate('/clients');
        }
      } else {
        setError(response.error?.message || 'Ein Fehler ist aufgetreten');
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Client name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Clientname *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`mt-1 block w-full px-3 py-2 border ${
            errors.name && touched.name ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
          aria-invalid={errors.name && touched.name ? 'true' : 'false'}
        />
        {errors.name && touched.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      {/* Contact person */}
      <div>
        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
          Ansprechpartner
        </label>
        <input
          type="text"
          id="contactPerson"
          name="contactPerson"
          value={values.contactPerson}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-Mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
            aria-invalid={errors.email && touched.email ? 'true' : 'false'}
          />
          {errors.email && touched.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Telefon
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={values.phone}
            onChange={handlePhoneChange}
            onBlur={handleBlur}
            placeholder="+49 123 456789"
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            aria-describedby={errors.phone && touched.phone ? 'phone-error' : undefined}
            aria-invalid={errors.phone && touched.phone ? 'true' : 'false'}
          />
          {errors.phone && touched.phone && (
            <p id="phone-error" className="mt-1 text-sm text-red-600">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Address section */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Adresse</h3>
      </div>

      <div>
        <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
          Straße
        </label>
        <input
          type="text"
          id="address.street"
          name="address.street"
          value={values.address.street}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
            Stadt
          </label>
          <input
            type="text"
            id="address.city"
            name="address.city"
            value={values.address.city}
            onChange={handleChange}
            onBlur={handleBlur}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700">
            PLZ
          </label>
          <input
            type="text"
            id="address.zipCode"
            name="address.zipCode"
            value={values.address.zipCode}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength="5"
            className={`mt-1 block w-full px-3 py-2 border ${
              errors['address.zipCode'] && touched['address.zipCode'] ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            aria-describedby={errors['address.zipCode'] && touched['address.zipCode'] ? 'zipCode-error' : undefined}
            aria-invalid={errors['address.zipCode'] && touched['address.zipCode'] ? 'true' : 'false'}
          />
          {errors['address.zipCode'] && touched['address.zipCode'] && (
            <p id="zipCode-error" className="mt-1 text-sm text-red-600">
              {errors['address.zipCode']}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
            Land
          </label>
          <input
            type="text"
            id="address.country"
            name="address.country"
            value={values.address.country}
            onChange={handleChange}
            onBlur={handleBlur}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel || (() => navigate('/clients'))}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Wird gespeichert...' : isEditing ? 'Aktualisieren' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
};

ClientForm.propTypes = {
  client: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    contactPerson: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.shape({
      street: PropTypes.string,
      city: PropTypes.string,
      zipCode: PropTypes.string,
      country: PropTypes.string
    })
  }),
  isEditing: PropTypes.bool,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default ClientForm;