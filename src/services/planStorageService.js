import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

class PlanStorageService {
  constructor() {
    this.plansCollection = 'agroforestry_plans';
  }

  /**
   * Save a generated agroforestry plan to Firestore
   * @param {string} userId - The authenticated user's UID
   * @param {Object} plan - The generated plan data
   * @param {Object} inputs - The farmer inputs used to generate the plan
   * @returns {Promise<string>} - The document ID of the saved plan
   */
  async savePlan(userId, plan, inputs) {
    try {
      const planDoc = {
        user_id: userId,
        plan: plan,
        inputs: inputs,
        created_at: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.plansCollection), planDoc);
      console.log('Plan saved to Firebase with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving plan to Firebase:', error);
      throw error;
    }
  }

  /**
   * Retrieve the most recent plan for a user
   * @param {string} userId - The authenticated user's UID
   * @returns {Promise<Object|null>} - The most recent plan or null
   */
  async getLatestPlan(userId) {
    try {
      const plansQuery = query(
        collection(db, this.plansCollection),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(plansQuery);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error retrieving latest plan:', error);
      return null;
    }
  }

  /**
   * Retrieve recent plans for a user
   * @param {string} userId - The authenticated user's UID
   * @param {number} limitCount - Number of plans to retrieve
   * @returns {Promise<Array>} - Array of plan records
   */
  async getUserPlans(userId, limitCount = 10) {
    try {
      const plansQuery = query(
        collection(db, this.plansCollection),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(plansQuery);
      const plans = [];

      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return plans;
    } catch (error) {
      console.error('Error retrieving user plans:', error);
      return [];
    }
  }
}

export default new PlanStorageService();
