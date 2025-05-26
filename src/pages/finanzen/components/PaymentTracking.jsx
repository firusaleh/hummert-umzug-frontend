import React, { useState } from 'react';
import { Calendar, Euro, CreditCard, AlertCircle, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../../services/api';

const PaymentTracking = ({ invoice, onUpdate, onClose }) => {
  const [payment, setPayment] = useState({
    betrag: invoice.gesamtbetrag - (invoice.bezahltBetrag || 0),
    datum: format(new Date(), 'yyyy-MM-dd'),
    zahlungsart: 'ueberweisung',
    referenz: '',
    notizen: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const zahlungsarten = [
    { value: 'ueberweisung', label: 'Überweisung', icon: CreditCard },
    { value: 'bar', label: 'Bar', icon: Euro },
    { value: 'ec', label: 'EC-Karte', icon: CreditCard },
    { value: 'kreditkarte', label: 'Kreditkarte', icon: CreditCard },
    { value: 'paypal', label: 'PayPal', icon: CreditCard },
    { value: 'sonstige', label: 'Sonstige', icon: Euro }
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setPayment(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update invoice with payment
      const updatedInvoice = {
        ...invoice,
        zahlungen: [
          ...(invoice.zahlungen || []),
          {
            ...payment,
            datum: new Date(payment.datum),
            erstellt: new Date()
          }
        ],
        bezahltBetrag: (invoice.bezahltBetrag || 0) + payment.betrag
      };

      // Check if fully paid
      if (updatedInvoice.bezahltBetrag >= invoice.gesamtbetrag) {
        updatedInvoice.status = 'bezahlt';
        updatedInvoice.bezahltDatum = new Date(payment.datum);
      } else {
        updatedInvoice.status = 'teilbezahlt';
      }

      await api.put(`/finanzen/rechnungen/${invoice._id}`, updatedInvoice);
      onUpdate();
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('Fehler beim Erfassen der Zahlung');
    } finally {
      setLoading(false);
    }
  };

  const remainingAmount = invoice.gesamtbetrag - (invoice.bezahltBetrag || 0);
  const isFullyPaid = remainingAmount <= 0;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Zahlung erfassen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Rechnung</p>
              <p className="font-medium">{invoice.rechnungsnummer}</p>
              <p className="text-sm text-gray-500">{invoice.kunde?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Rechnungsbetrag</p>
              <p className="text-xl font-bold">€ {invoice.gesamtbetrag.toFixed(2)}</p>
              {invoice.bezahltBetrag > 0 && (
                <>
                  <p className="text-sm text-gray-600 mt-2">Bereits bezahlt</p>
                  <p className="text-green-600 font-medium">€ {invoice.bezahltBetrag.toFixed(2)}</p>
                </>
              )}
              <p className="text-sm text-gray-600 mt-2">Offener Betrag</p>
              <p className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                € {remainingAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {isFullyPaid ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">Diese Rechnung ist bereits vollständig bezahlt.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zahlungsbetrag *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="betrag"
                  value={payment.betrag}
                  onChange={handleInputChange}
                  min="0.01"
                  max={remainingAmount}
                  step="0.01"
                  required
                  className="w-full px-3 py-2 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Euro className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setPayment(prev => ({ ...prev, betrag: remainingAmount }))}
                  className="absolute right-2 top-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Vollbetrag
                </button>
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zahlungsdatum *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="datum"
                  value={payment.datum}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zahlungsart *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {zahlungsarten.map(art => {
                  const Icon = art.icon;
                  const isSelected = payment.zahlungsart === art.value;
                  return (
                    <button
                      key={art.value}
                      type="button"
                      onClick={() => setPayment(prev => ({ ...prev, zahlungsart: art.value }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mx-auto mb-1 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <span className={`text-xs font-medium ${
                        isSelected ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        {art.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referenz / Transaktionsnummer
              </label>
              <input
                type="text"
                name="referenz"
                value={payment.referenz}
                onChange={handleInputChange}
                placeholder="z.B. Überweisungs-ID, Belegnummer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notizen
              </label>
              <textarea
                name="notizen"
                value={payment.notizen}
                onChange={handleInputChange}
                rows={3}
                placeholder="Zusätzliche Informationen zur Zahlung..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Speichern...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Zahlung erfassen
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Payment History */}
        {invoice.zahlungen && invoice.zahlungen.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Zahlungshistorie
            </h4>
            <div className="space-y-2">
              {invoice.zahlungen.map((zahlung, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        € {zahlung.betrag.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(zahlung.datum), 'dd.MM.yyyy', { locale: de })}
                        {zahlung.zahlungsart && ` • ${zahlungsarten.find(z => z.value === zahlung.zahlungsart)?.label}`}
                      </p>
                      {zahlung.referenz && (
                        <p className="text-xs text-gray-500 mt-1">Ref: {zahlung.referenz}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTracking;