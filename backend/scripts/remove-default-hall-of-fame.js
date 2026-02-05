/**
 * Script to remove default/test Hall of Fame members
 * Run this script to clean up any default members that shouldn't be displayed
 * 
 * Usage: node backend/scripts/remove-default-hall-of-fame.js
 */

import pool from '../utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function removeDefaultMembers() {
  try {
    console.log('Checking for Hall of Fame members...');
    
    // Get all members
    const { rows } = await pool.query('SELECT * FROM hall_of_fame ORDER BY created_at ASC');
    
    console.log(`Found ${rows.length} Hall of Fame member(s)`);
    
    if (rows.length === 0) {
      console.log('No members to remove.');
      return;
    }
    
    // List all members
    console.log('\nCurrent Hall of Fame members:');
    rows.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} (${member.profession || 'N/A'}) - Created: ${member.created_at}`);
    });
    
    // Ask for confirmation (in production, you might want to add filters)
    console.log('\n⚠️  To remove specific members, use the admin panel or run:');
    console.log('   DELETE FROM hall_of_fame WHERE id = \'<member-id>\';');
    console.log('\nTo remove ALL members (use with caution):');
    console.log('   DELETE FROM hall_of_fame;');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeDefaultMembers();
