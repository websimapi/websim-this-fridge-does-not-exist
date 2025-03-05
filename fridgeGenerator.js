// Fridge image and description generator functions

// Generate description using LLM based on user input
async function generateFridgeDescription(groceries, preferences, diet) {
  try {
    const completion = await websim.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a creative food writer who specializes in describing the contents of a refrigerator. 
          You create vivid, descriptive text about how the ingredients inside the fridge would look, their arrangement, 
          and suggest what meals could be made with these ingredients.
          Keep your response between 100-150 words and make it fun and interesting.
          The output will be used to generate an image of this fictional fridge.`
        },
        {
          role: "user",
          content: `Create a description of a refrigerator that contains these groceries: ${groceries}.
          Additional preferences: ${preferences || "None"}.
          Dietary considerations: ${diet || "None"}.
          Make the description detailed and visual, as it will be used to generate an image of this fridge.`
        }
      ]
    });
    
    return completion.content;
  } catch (error) {
    console.error("Error generating fridge description:", error);
    throw error;
  }
}

// Generate detailed image prompt based on the fridge description
async function generateImagePrompt(description) {
  try {
    const completion = await websim.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an image prompt engineer who creates detailed prompts for image generation. 
          Your task is to take a description of a refrigerator and create a detailed prompt for generating a photorealistic 
          image of the fridge's interior. Focus on lighting, arrangement, colors, and details.`
        },
        {
          role: "user",
          content: `Based on this refrigerator description, create a detailed image generation prompt:
          "${description}"
          Make the prompt highly detailed for a photorealistic look. Begin with "A photorealistic image of an open refrigerator containing"`
        }
      ]
    });
    
    return completion.content;
  } catch (error) {
    console.error("Error generating image prompt:", error);
    throw error;
  }
}

// Parse description to identify fridge items for visualization
async function parseFridgeItems(description) {
  try {
    const completion = await websim.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Analyze the given refrigerator description and extract a list of food items mentioned.
          Respond directly with JSON, following this JSON schema, and no other text:
          {
            "items": [
              {
                "name": "string",
                "category": "dairy|produce|meat|beverage|condiment|leftover|other"
              }
            ]
          }`
        },
        {
          role: "user",
          content: description
        }
      ],
      json: true
    });
    
    return JSON.parse(completion.content);
  } catch (error) {
    console.error("Error parsing fridge items:", error);
    return { items: [] }; // Return empty array on error
  }
}

// Generate fridge image using the prompt
async function generateFridgeImage(prompt) {
  try {
    const result = await websim.imageGen({
      prompt: prompt,
      aspect_ratio: "1:1"
    });
    
    return result.url;
  } catch (error) {
    console.error("Error generating fridge image:", error);
    throw error;
  }
}

// Get image URL for a food item
function getFoodItemImage(item) {
  // Map common food items to image URLs
  const itemImages = {
    // Dairy
    milk: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200",
    cheese: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=200",
    yogurt: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=200",
    butter: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200",
    
    // Produce
    apple: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200",
    banana: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=200",
    lettuce: "https://images.unsplash.com/photo-1622205313162-be1d5712a43b?w=200",
    tomato: "https://images.unsplash.com/photo-1561136594-7f68413baa99?w=200",
    carrot: "https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?w=200",
    broccoli: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=200",
    
    // Meat
    chicken: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200",
    beef: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200",
    fish: "https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=200",
    
    // Beverages
    water: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200",
    juice: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200",
    soda: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=200",
    
    // Condiments
    ketchup: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200",
    mustard: "https://images.unsplash.com/photo-1528750717929-32abb73d3bd9?w=200",
    jam: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200",
    
    // Default
    default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"
  };
  
  // Try to find the item in our map, or find a similar key
  const itemName = item.name.toLowerCase();
  let imageUrl = itemImages.default;
  
  for (const [key, url] of Object.entries(itemImages)) {
    if (itemName.includes(key)) {
      imageUrl = url;
      break;
    }
  }
  
  return imageUrl;
}

