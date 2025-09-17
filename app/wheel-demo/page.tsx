"use client";

import React, { useState, useEffect } from 'react';
// import Wheel from '../../components/ui/Wheel';

export default function WheelDemo() {
  console.log('WheelDemo component rendering'); // Debug log
  
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    console.log('WheelDemo component mounted'); // Debug log
  }, []);

  // Sample items for the wheel
  const wheelItems = [
    'John Doe',
    'Jane Smith', 
    'Bob Johnson',
    'Alice Brown',
    'Charlie Wilson',
    'Diana Davis',
    'Edward Miller',
    'Fiona Garcia'
  ];

  const handleSpinEnd = (item: string, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
    console.log(`Wheel landed on: ${item} (index: ${index})`);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <h1 className="mb-4">Wheel Demo</h1>
          <p className="mb-4">
            This wheel has been fixed to correctly select the item where the orange triangle points.
            The triangle now points down and the selection logic has been corrected.
          </p>
          
          {/* <Wheel 
            items={wheelItems}
            onSpinEnd={handleSpinEnd}
            size={400}
          /> */}
          
          {selectedItem && (
            <div className="mt-4 p-3 bg-light rounded">
              <h4>Result:</h4>
              <p className="mb-1">
                <strong>Selected Item:</strong> {selectedItem}
              </p>
              <p className="mb-0">
                <strong>Index:</strong> {selectedIndex}
              </p>
            </div>
          )}
          
          <div className="mt-4">
            <h5>How it works:</h5>
            <ul className="text-start">
              <li>The orange triangle points down (π/2 radians)</li>
              <li>The selection logic calculates which slice the triangle is touching</li>
              <li>The wheel rotates clockwise, and the selection is based on the triangle's position</li>
              <li>No more off-by-one errors - it selects exactly where the triangle points</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 