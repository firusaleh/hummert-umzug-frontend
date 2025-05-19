// src/context/__tests__/FormContext.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, FormField, useForm, validators } from '../FormContext';

// Test form component
const TestForm = ({ onSubmit, validationSchema }) => {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleSubmit,
    resetForm
  } = useForm();

  return (
    <form onSubmit={handleSubmit}>
      <div data-testid="values">{JSON.stringify(values)}</div>
      <div data-testid="errors">{JSON.stringify(errors)}</div>
      <div data-testid="touched">{JSON.stringify(touched)}</div>
      <div data-testid="isSubmitting">{isSubmitting.toString()}</div>
      <div data-testid="isValid">{isValid.toString()}</div>
      <div data-testid="isDirty">{isDirty.toString()}</div>
      
      <FormField
        name="email"
        component={({ value, onChange, onBlur, error }) => (
          <div>
            <input
              data-testid="email-input"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
            />
            {error && <span data-testid="email-error">{error}</span>}
          </div>
        )}
      />
      
      <FormField
        name="password"
        component={({ value, onChange, onBlur, error }) => (
          <div>
            <input
              data-testid="password-input"
              type="password"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
            />
            {error && <span data-testid="password-error">{error}</span>}
          </div>
        )}
      />
      
      <button type="submit">Submit</button>
      <button type="button" onClick={() => resetForm()}>Reset</button>
    </form>
  );
};

const renderWithForm = (initialValues = {}, validationSchema = {}, onSubmit = jest.fn()) => {
  return render(
    <FormProvider
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      <TestForm />
    </FormProvider>
  );
};

describe('FormContext', () => {
  it('should render with initial values', () => {
    const initialValues = { email: 'test@example.com', password: '' };
    renderWithForm(initialValues);
    
    expect(screen.getByTestId('values').textContent).toBe(JSON.stringify(initialValues));
    expect(screen.getByTestId('email-input').value).toBe('test@example.com');
    expect(screen.getByTestId('password-input').value).toBe('');
  });

  it('should handle field changes', async () => {
    const user = userEvent.setup();
    renderWithForm();
    
    await user.type(screen.getByTestId('email-input'), 'new@example.com');
    
    await waitFor(() => {
      expect(screen.getByTestId('email-input').value).toBe('new@example.com');
      expect(screen.getByTestId('isDirty').textContent).toBe('true');
    });
  });

  it('should validate on blur', async () => {
    const user = userEvent.setup();
    const validationSchema = {
      email: validators.email()
    };
    
    renderWithForm({}, validationSchema);
    
    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur
    
    await waitFor(() => {
      expect(screen.getByTestId('email-error').textContent).toBe('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      expect(screen.getByTestId('touched').textContent).toContain('"email":true');
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    const validationSchema = {
      email: validators.required(),
      password: validators.required('Passwort ist erforderlich')
    };
    
    renderWithForm({}, validationSchema);
    
    await user.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(screen.getByTestId('email-error').textContent).toBe('Dieses Feld ist erforderlich');
      expect(screen.getByTestId('password-error').textContent).toBe('Passwort ist erforderlich');
    });
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const validationSchema = {
      email: validators.email(),
      password: validators.minLength(6)
    };
    
    renderWithForm({ email: '', password: '' }, validationSchema, onSubmit);
    
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('should prevent submission with validation errors', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const validationSchema = {
      email: validators.required()
    };
    
    renderWithForm({}, validationSchema, onSubmit);
    
    await user.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByTestId('isSubmitting').textContent).toBe('false');
    });
  });

  it('should reset form', async () => {
    const user = userEvent.setup();
    const initialValues = { email: 'initial@example.com', password: '' };
    renderWithForm(initialValues);
    
    await user.type(screen.getByTestId('email-input'), 'changed@example.com');
    await user.click(screen.getByText('Reset'));
    
    await waitFor(() => {
      expect(screen.getByTestId('email-input').value).toBe('initial@example.com');
      expect(screen.getByTestId('isDirty').textContent).toBe('false');
    });
  });

  it('should combine validators', async () => {
    const user = userEvent.setup();
    const validationSchema = {
      email: validators.combine(
        validators.required(),
        validators.email()
      )
    };
    
    renderWithForm({}, validationSchema);
    
    // Test required
    await user.click(screen.getByTestId('email-input'));
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByTestId('email-error').textContent).toBe('Dieses Feld ist erforderlich');
    });
    
    // Test email format
    await user.type(screen.getByTestId('email-input'), 'invalid');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByTestId('email-error').textContent).toBe('Bitte geben Sie eine gültige E-Mail-Adresse ein');
    });
  });

  it('should validate German phone numbers', async () => {
    const user = userEvent.setup();
    const TestPhoneForm = () => {
      const { values, errors, touched } = useForm();
      
      return (
        <FormField
          name="phone"
          component={({ value, onChange, onBlur, error }) => (
            <div>
              <input
                data-testid="phone-input"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
              />
              {error && <span data-testid="phone-error">{error}</span>}
            </div>
          )}
        />
      );
    };
    
    render(
      <FormProvider
        initialValues={{ phone: '' }}
        validationSchema={{ phone: validators.germanPhone() }}
      >
        <TestPhoneForm />
      </FormProvider>
    );
    
    const phoneInput = screen.getByTestId('phone-input');
    
    // Invalid phone
    await user.type(phoneInput, '123');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByTestId('phone-error')).toBeInTheDocument();
    });
    
    // Valid phone
    await user.clear(phoneInput);
    await user.type(phoneInput, '+49 123 456789');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.queryByTestId('phone-error')).not.toBeInTheDocument();
    });
  });

  it('should validate German postal codes', async () => {
    const user = userEvent.setup();
    const TestPlzForm = () => {
      return (
        <FormField
          name="plz"
          component={({ value, onChange, onBlur, error }) => (
            <div>
              <input
                data-testid="plz-input"
                value={value}
                onChange={onChange}
                onBlur={onBlur}
              />
              {error && <span data-testid="plz-error">{error}</span>}
            </div>
          )}
        />
      );
    };
    
    render(
      <FormProvider
        initialValues={{ plz: '' }}
        validationSchema={{ plz: validators.germanPostalCode() }}
      >
        <TestPlzForm />
      </FormProvider>
    );
    
    const plzInput = screen.getByTestId('plz-input');
    
    // Invalid PLZ
    await user.type(plzInput, '1234');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByTestId('plz-error')).toBeInTheDocument();
    });
    
    // Valid PLZ
    await user.clear(plzInput);
    await user.type(plzInput, '12345');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.queryByTestId('plz-error')).not.toBeInTheDocument();
    });
  });

  it('should throw error when useForm is used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      const form = useForm();
      return <div>{form.values}</div>;
    };
    
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useForm must be used within a FormProvider');
    
    console.error = originalError;
  });
});