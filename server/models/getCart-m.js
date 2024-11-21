  static async getUserCartWithNutrients(userId) {
    try {
      // const { userId } = userId;
      const [cartItems, itemNutrients] = await Promise.all([
        dbPool.query(
          `SELECT product.*, cart.quantity 
          FROM cart 
          JOIN product ON cart.product_id = product.product_id 
          WHERE cart.user_id = ?`,
          [userId]
        ),
        dbPool.query(
          `SELECT product.*, cart.quantity, 
             nutrient.energy, nutrient.calories, nutrient.fat, nutrient.saturates, nutrient.sugars, nutrient.salt
          FROM cart
          JOIN product ON cart.product_id = product.product_id
          JOIN nutrient ON product.product_id = nutrient.product_id
          WHERE cart.user_id = ?`,
          [userId]
        ),
      ]);
      // if (!cartItems[0] || cartItems[0].length === 0) {
      //   return res.status(404).json({ message: "Cart is empty." });
      // }
      // console.log("Backend: ", itemNutrients[0]);
      const totalNutrition = {
        energy: 0,
        calories: 0,
        fat: 0,
        saturates: 0,
        sugars: 0,
        salt: 0,
      };
      itemNutrients[0].forEach((item) => {
        totalNutrition.energy += item.energy * item.quantity;
        totalNutrition.calories += item.calories * item.quantity;
        totalNutrition.fat += item.fat * item.quantity;
        totalNutrition.saturates += item.saturates * item.quantity;
        totalNutrition.sugars += item.sugars * item.quantity;
        totalNutrition.salt += item.salt * item.quantity;
      });

      totalNutrition.energy = parseFloat(totalNutrition.energy.toFixed(1));
      totalNutrition.calories = parseFloat(totalNutrition.calories.toFixed(1));
      totalNutrition.fat = parseFloat(totalNutrition.fat.toFixed(1));
      totalNutrition.saturates = parseFloat(
        totalNutrition.saturates.toFixed(1)
      );
      totalNutrition.sugars = parseFloat(totalNutrition.sugars.toFixed(1));
      totalNutrition.salt = parseFloat(totalNutrition.salt.toFixed(1));

      const cartWithCalories = itemNutrients[0].map((item) => {
        const itemCalories = item.calories * item.quantity;
        totalNutrition.energy += item.energy * item.quantity;
        totalNutrition.calories += itemCalories;
        totalNutrition.fat += item.fat * item.quantity;
        totalNutrition.saturates += item.saturates * item.quantity;
        totalNutrition.sugars += item.sugars * item.quantity;
        totalNutrition.salt += item.salt * item.quantity;

        // Add a field for calories per product
        return {
          ...item,
          caloriesPerProduct: parseFloat(itemCalories.toFixed(1)), // Round to 1 decimal
        };
      });
      return {
        status: "success",
        cartItems: cartWithCalories,
        totalNutrition: totalNutrition,
      };
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }
