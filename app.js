// Main React application
const { useState, useEffect, useMemo } = React;
const { createRoot } = ReactDOM;

// Main App Component
function App() {
  return (
    <div className="container">
      <Header />
      <FridgeGenerator />
      <FridgeGallery />
    </div>
  );
}

// Header Component
function Header() {
  return (
    <header>
      <h1>This Fridge Does Not Exist</h1>
      <p className="subtitle">Generate a unique virtual fridge based on your groceries!</p>
    </header>
  );
}

// Fridge Generator Form
function FridgeGenerator() {
  const [groceries, setGroceries] = useState('');
  const [preferences, setPreferences] = useState('');
  const [diet, setDiet] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groceries.trim()) {
      setError('Please enter at least some groceries');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      // First LLM call - Generate fridge description
      const description = await generateFridgeDescription(groceries, preferences, diet);
      
      // Second LLM call - Create detailed image prompt
      const imagePrompt = await generateImagePrompt(description);
      
      // Generate image URL using the detailed prompt
      const imageUrl = await generateFridgeImage(imagePrompt);
      
      // Parse items from description for visualization
      const fridgeItems = await parseFridgeItems(description);
      
      // Store in database
      const fridgeData = {
        description,
        imageUrl,
        groceries,
        preferences,
        diet,
        fridgeItems: JSON.stringify(fridgeItems)
      };
      
      const createdFridge = await fridgeCollection.create(fridgeData);
      
      // Notify others
      notifyNewFridge(createdFridge);
      
      // Reset form
      setGroceries('');
      setPreferences('');
      setDiet('');
      
    } catch (err) {
      console.error("Error creating fridge:", err);
      setError('An error occurred while generating your fridge. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fridge-generator">
      <h2>Create Your Virtual Fridge</h2>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="groceries">What groceries are in your fridge?*</label>
          <textarea 
            id="groceries"
            value={groceries}
            onChange={(e) => setGroceries(e.target.value)}
            placeholder="e.g., milk, eggs, cheese, apples, leftovers from last night's pasta"
            required
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="preferences">Any specific preferences?</label>
          <input 
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g., organized, messy, minimalist, colorful"
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="diet">Dietary considerations?</label>
          <input 
            id="diet"
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            placeholder="e.g., vegan, keto, gluten-free, vegetarian"
          />
        </div>
        
        <button type="submit" disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate My Fridge'}
        </button>
      </form>
      
      {isGenerating && (
        <div className="loading">
          Please wait while we stock your virtual fridge...
        </div>
      )}
    </div>
  );
}

// Fridge Gallery Component
function FridgeGallery() {
  const [fridges, setFridges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to fridge collection changes
    const unsubscribe = fridgeCollection.subscribe((fridgeData) => {
      // Sort fridges by created_at timestamp, newest first
      const sortedFridges = [...fridgeData].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setFridges(sortedFridges);
      setLoading(false);
    });
    
    // Initial load
    const loadInitialFridges = async () => {
      const initialFridges = fridgeCollection.getAll();
      if (initialFridges.length > 0) {
        const sortedFridges = [...initialFridges].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setFridges(sortedFridges);
      }
      setLoading(false);
    };
    
    loadInitialFridges();
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading gallery...</div>;
  }

  return (
    <div>
      <h2>Fridge Gallery</h2>
      {fridges.length === 0 ? (
        <p>No fridges created yet. Be the first to create one!</p>
      ) : (
        <div className="gallery">
          {fridges.map((fridge) => (
            <FridgeDisplay key={fridge.id} fridge={fridge} />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual Fridge Display Component
function FridgeDisplay({ fridge }) {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    // Parse fridge items from JSON string
    if (fridge.fridgeItems) {
      try {
        const parsedItems = JSON.parse(fridge.fridgeItems);
        setItems(parsedItems.items || []);
      } catch (err) {
        console.error("Error parsing fridge items:", err);
        setItems([]);
      }
    }
  }, [fridge.fridgeItems]);

  // Dynamically create shelves based on categories
  const shelves = useMemo(() => {
    const categories = {
      dairy: [],
      produce: [],
      meat: [],
      beverage: [],
      condiment: [],
      leftover: [],
      other: []
    };
    
    // Group items by category
    items.forEach(item => {
      if (categories[item.category]) {
        categories[item.category].push(item);
      } else {
        categories.other.push(item);
      }
    });
    
    // Return only categories that have items
    return Object.entries(categories)
      .filter(([_, items]) => items.length > 0)
      .map(([category, items]) => ({ category, items }));
  }, [items]);

  return (
    <div className="fridge-item">
      <div className="fridge-content">
        <div className="fridge-container">
          {shelves.length > 0 ? (
            // Display shelves with food items
            shelves.map((shelf, index) => (
              <div key={index} className="fridge-shelf">
                {shelf.items.map((item, itemIndex) => (
                  <img 
                    key={itemIndex} 
                    src={getFoodItemImage(item)} 
                    alt={item.name}
                    className="fridge-item-img"
                    title={item.name}
                  />
                ))}
              </div>
            ))
          ) : (
            // Fallback to showing the generated image
            <img 
              src={fridge.imageUrl} 
              alt="Generated fridge" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <div className="fridge-door-handle"></div>
        </div>
      </div>
      
      <div className="fridge-info">
        <div className="username">{fridge.username}</div>
        <div className="timestamp">{formatDate(fridge.created_at)}</div>
        <div className="fridge-description">{fridge.description}</div>
      </div>
    </div>
  );
}

// Render the application
const root = createRoot(document.getElementById('app'));
root.render(<App />);

