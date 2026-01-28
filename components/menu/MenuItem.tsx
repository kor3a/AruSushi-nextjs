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
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string | string[] }>({});

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleMultiSelectChange = (optionName: string, choice: string, checked: boolean) => {
    setSelectedOptions(prev => {
      const current = prev[optionName] as string[] || [];
      if (checked) {
        return { ...prev, [optionName]: [...current, choice] };
      } else {
        return { ...prev, [optionName]: current.filter(c => c !== choice) };
      }
    });
  };

  const isAddonSelected = (optionName: string, choice: string): boolean => {
    const selected = selectedOptions[optionName] as string[] || [];
    return selected.includes(choice);
  };

  const areRequiredOptionsSelected = () => {
    if (!options) return true;
    return options.every(option => {
      if (option.required) {
        const value = selectedOptions[option.name];
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value && String(value).trim() !== '';
      }
      return true;
    });
  };

  const calculatePrice = (): number => {
    if (!options || options.length === 0) {
      return price;
    }

    let calculatedPrice = price;

    // Check for choicePrices (single select with price)
    for (const option of options) {
      if (option.choicePrices && selectedOptions[option.name]) {
        const selectedChoice = selectedOptions[option.name];
        if (typeof selectedChoice === 'string' && option.choicePrices[selectedChoice] !== undefined) {
          calculatedPrice = option.choicePrices[selectedChoice];
          break; // Use the first matching price option
        }
      }
    }

    // Add add-on prices
    for (const option of options) {
      if (option.addonPrices && option.isMultiSelect) {
        const selectedAddons = selectedOptions[option.name] as string[] || [];
        selectedAddons.forEach(addon => {
          if (option.addonPrices && option.addonPrices[addon] !== undefined) {
            calculatedPrice += option.addonPrices[addon];
          }
        });
      }
    }

    return calculatedPrice;
  };

  const currentPrice = calculatePrice();

  const handleAddToCart = () => {
    // If item has options and they're not shown yet, show them instead of adding
    if (options && options.length > 0 && !showOptions) {
      setShowOptions(true);
      return;
    }

    // If options are required but not all selected, don't add
    if (options && !areRequiredOptionsSelected()) {
      return;
    }
    
    // Convert arrays to comma-separated strings for storage
    const optionsForCart: { [key: string]: string } = {};
    if (options) {
      Object.entries(selectedOptions).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          optionsForCart[key] = value.join(', ');
        } else {
          optionsForCart[key] = String(value);
        }
      });
    }
    
    addItem({ name, price: currentPrice }, 1, specialNotes, options ? optionsForCart : undefined);
    setAdded(true);
    setShowNotes(false);
    setShowOptions(false);
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
        <h3 id="price">${currentPrice.toFixed(2)}</h3>
      </div>

      {description && (
        <div className="item-desc">
          <span className="description">{description}</span>
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        {options && options.length > 0 && showOptions && (
          <div style={{ marginBottom: '15px', padding: '12px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            {options.map((option) => (
              <div key={option.name} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                  {option.label} {option.required && <span style={{ color: '#fc3678' }}>*</span>}
                </label>
                {option.isMultiSelect ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {option.choices.map((choice) => (
                      <label
                        key={choice}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '4px',
                          background: isAddonSelected(option.name, choice) ? '#e8f5e9' : 'white',
                          border: '1px solid #ddd'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAddonSelected(option.name, choice)}
                          onChange={(e) => handleMultiSelectChange(option.name, choice, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px' }}>
                          {choice}
                          {option.addonPrices && option.addonPrices[choice] !== undefined && (
                            <span style={{ color: '#666', marginLeft: '8px' }}>
                              (+${option.addonPrices[choice].toFixed(2)})
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <select
                    value={typeof selectedOptions[option.name] === 'string' ? selectedOptions[option.name] as string : ''}
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
                        {choice}{option.choicePrices && option.choicePrices[choice] !== undefined ? ` ($${option.choicePrices[choice].toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                )}
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
            disabled={added || (showOptions && options && !areRequiredOptionsSelected())}
            style={{
              background: added ? '#10b981' : (showOptions && options && !areRequiredOptionsSelected()) ? '#ccc' : '#fc3678',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: (added || (showOptions && options && !areRequiredOptionsSelected())) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.3s'
            }}
            title={showOptions && options && !areRequiredOptionsSelected() ? 'Please select all required options' : ''}
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
