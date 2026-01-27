import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { FaShoppingCart, FaCheck } from 'react-icons/fa';
import { MenuItemOption } from '../../data/menuData';

interface MenuItemProps {
  name: string;
  price: number;
  description?: string;
  options?: MenuItemOption[];
}

export default function MenuItem({ name, price, description, options }: MenuItemProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const areRequiredOptionsSelected = () => {
    if (!options) return true;
    return options.every(option => {
      if (option.required) {
        return selectedOptions[option.name] && selectedOptions[option.name].trim() !== '';
      }
      return true;
    });
  };

  const handleAddToCart = () => {
    if (options && !areRequiredOptionsSelected()) {
      return;
    }
    
    addItem({ name, price }, 1, specialNotes, options ? selectedOptions : undefined);
    setAdded(true);
    setShowNotes(false);
    setSpecialNotes('');
    setSelectedOptions({});

    // Reset the "added" state after 2 seconds
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="item-menu">
      <div className="item-info">
        <h3 id="name">{name}</h3>
        <span className="dots"></span>
        <h3 id="price">${price.toFixed(2)}</h3>
      </div>

      {description && (
        <div className="item-desc">
          <span className="description">{description}</span>
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        {options && options.length > 0 && (
          <div style={{ marginBottom: '15px', padding: '12px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            {options.map((option) => (
              <div key={option.name} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                  {option.label} {option.required && <span style={{ color: '#fc3678' }}>*</span>}
                </label>
                <select
                  value={selectedOptions[option.name] || ''}
                  onChange={(e) => handleOptionChange(option.name, e.target.value)}
                  required={option.required}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">-- Select {option.label} --</option>
                  {option.choices.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {showNotes && (
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Special instructions (optional)"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleAddToCart}
            disabled={added || (options && !areRequiredOptionsSelected())}
            style={{
              background: added ? '#10b981' : (options && !areRequiredOptionsSelected()) ? '#ccc' : '#fc3678',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: (added || (options && !areRequiredOptionsSelected())) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.3s'
            }}
            title={options && !areRequiredOptionsSelected() ? 'Please select all required options' : ''}
          >
            {added ? (
              <>
                <FaCheck size={14} /> Added!
              </>
            ) : (
              <>
                <FaShoppingCart size={14} /> Add to Cart
              </>
            )}
          </button>

          {!showNotes && !added && (
            <button
              onClick={() => setShowNotes(true)}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add Note
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
