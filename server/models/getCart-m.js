import { dbPool } from "../dbconfig.js";

export default class Cart {
  static async getUserCart(userId) {
    try {
      const query = `SELECT product.*, cart.quantity 
        FROM cart 
        JOIN product ON cart.product_id = product.product_id 
        WHERE cart.user_id = ?`;
      const [cartItems] = await dbPool.query(query, [userId]);

      if (!cartItems.length) {
        return { status: "error", message: "Cart is empty" };
      }
      //   console.log(cartItems);
      return { status: "success", cartItems: cartItems };
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

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

  static async postUserCart(userId, productId) {
    if (!userId || !productId) {
      return {
        status: "error",
        message: "User ID and Product ID are required",
      };
    }
    try {
      const checkQuery = `SELECT * FROM cart WHERE user_id = ? AND product_id = ?`;
      const [existingCartItem] = await dbPool.query(checkQuery, [
        userId,
        productId,
      ]);

      if (existingCartItem.length > 0) {
        const updateQuery = `UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?`;
        await dbPool.query(updateQuery, [userId, productId]);
      } else {
        const insertQuery = `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)`;
        await dbPool.query(insertQuery, [userId, productId]);
      }
      return {
        status: "success",
        message: "Product added to cart successfully",
      };
    } catch (error) {
      console.error("Error adding product to cart:", error);
      return { error: "Internal server error" };
    }
  }

  static async removeProductFromCart(userId, productId) {
    const query = `DELETE FROM cart WHERE user_id = ? AND product_id = ?`;
    const [result] = await dbPool.query(query, [userId, productId]);
    return result;
  }
}
