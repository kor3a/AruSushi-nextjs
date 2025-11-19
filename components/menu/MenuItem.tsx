import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { FaShoppingCart, FaCheck } from 'react-icons/fa';

interface MenuItemProps {
  name: string;
  price: number;
  description?: string;
}

export default function MenuItem({ name, price, description }: MenuItemProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const handleAddToCart = () => {
    addItem({ name, price }, 1, specialNotes);
    setAdded(true);
    setShowNotes(false);
    setSpecialNotes('');

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
            disabled={added}
            style={{
              background: added ? '#10b981' : '#fc3678',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: added ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.3s'
            }}
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
