import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CycleTypeService } from '../services/cycle-type.service';
import { ICycleType } from '../app.models';
import { trigger, transition, style, animate } from '@angular/animations';

interface Cycle {
  id: number;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
}

interface Brand {
  id: number;
  name: string;
}

interface StockMovement {
  id: number;
  cycleId: number;
  cycleName: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  notes?: string;
}

@Component({
  selector: 'app-cycles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './cycles.component.html',
  styleUrl: './cycles.component.scss',
  providers: [CycleTypeService],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.4s ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class CyclesComponent implements OnInit {
  activeTab: 'cycles' | 'categories' | 'brands' | 'stock' = 'cycles';
  
  // Forms
  cycleForm: FormGroup;
  categoryForm: FormGroup;
  brandForm: FormGroup;
  stockMovementForm: FormGroup;
  
  // Loading states
  isLoadingCycleTypes: boolean = false;
  isLoadingCycles: boolean = false;
  isLoadingBrands: boolean = false;
  isLoadingStockMovements: boolean = false;
  
  // Data
  cycles: Cycle[] = [
    { id: 1, name: 'Mountain Explorer Pro', category: 'Mountain Bikes', brand: 'CyclePro', price: 24999, stock: 15, image: 'assets/images/mountain-bike.jpg', description: 'Professional mountain bike with 21-speed gear system' },
    { id: 2, name: 'Roadster Elite', category: 'Road Bikes', brand: 'SpeedX', price: 18500, stock: 8, image: 'assets/images/road-bike.jpg', description: 'Lightweight road bike for professional cyclists' },
    { id: 3, name: 'City Cruiser', category: 'City Bikes', brand: 'UrbanRide', price: 12500, stock: 22, image: 'assets/images/city-bike.jpg', description: 'Comfortable city bike for everyday commuting' },
    { id: 4, name: 'BMX Stunt Pro', category: 'BMX', brand: 'XtremeRide', price: 14999, stock: 5, image: 'assets/images/bmx.jpg', description: 'Professional BMX bike for stunts and tricks' },
    { id: 5, name: 'Kids Explorer', category: 'Kids Bikes', brand: 'JuniorRide', price: 6500, stock: 18, image: 'assets/images/kids-bike.jpg', description: 'Safe and durable bike for children aged 7-10' },
  ];
  
  cycleTypes: ICycleType[] = [];
  
  brands: Brand[] = [
    { id: 1, name: 'CyclePro' },
    { id: 2, name: 'SpeedX' },
    { id: 3, name: 'UrbanRide' },
    { id: 4, name: 'XtremeRide' },
    { id: 5, name: 'JuniorRide' },
    { id: 6, name: 'MountainKing' },
  ];
  
  stockMovements: StockMovement[] = [
    { id: 1, cycleId: 1, cycleName: 'Mountain Explorer Pro', type: 'in', quantity: 5, date: '2025-04-15', notes: 'New shipment from supplier' },
    { id: 2, cycleId: 2, cycleName: 'Roadster Elite', type: 'out', quantity: 2, date: '2025-04-18', notes: 'Store display models' },
    { id: 3, cycleId: 3, cycleName: 'City Cruiser', type: 'in', quantity: 10, date: '2025-04-20', notes: 'Restocking' },
    { id: 4, cycleId: 5, cycleName: 'Kids Explorer', type: 'out', quantity: 3, date: '2025-04-22', notes: 'Promotional giveaway' },
  ];
  
  // Selected item for editing
  selectedCycle: Cycle | null = null;
  selectedCycleType: ICycleType | null = null;
  selectedBrand: Brand | null = null;
  
  // Error message
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private cycleTypeService: CycleTypeService
  ) {
    // Initialize forms
    this.cycleForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      brand: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      image: [''],
      description: ['']
    });
    
    this.categoryForm = this.fb.group({
      typeName: ['', Validators.required],
      description: ['', Validators.required]
    });
    
    this.brandForm = this.fb.group({
      name: ['', Validators.required]
    });
    
    this.stockMovementForm = this.fb.group({
      cycleId: ['', Validators.required],
      type: ['in', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCycleTypes();
  }

  // Load cycle types from API
  loadCycleTypes(): void {
    this.isLoadingCycleTypes = true;
    this.errorMessage = '';
    
    this.cycleTypeService.getAllCycleTypes().subscribe({
      next: (data) => {
        // Simulate loading delay for better UX demonstration
        setTimeout(() => {
          this.cycleTypes = data;
          this.isLoadingCycleTypes = false;
        }, 1000);
      },
      error: (error) => {
        console.error('Error fetching cycle types:', error);
        this.errorMessage = 'Failed to load categories. Please try again later.';
        this.isLoadingCycleTypes = false;
      }
    });
  }

  setActiveTab(tab: 'cycles' | 'categories' | 'brands' | 'stock'): void {
    this.activeTab = tab;
    this.resetForms();
    
    // Simulate loading states for each tab
    if (tab === 'categories') {
      this.loadCycleTypes();
    } else if (tab === 'cycles') {
      this.isLoadingCycles = true;
      // Simulate API call delay
      setTimeout(() => {
        this.isLoadingCycles = false;
      }, 800);
    } else if (tab === 'brands') {
      this.isLoadingBrands = true;
      // Simulate API call delay
      setTimeout(() => {
        this.isLoadingBrands = false;
      }, 600);
    } else if (tab === 'stock') {
      this.isLoadingStockMovements = true;
      // Simulate API call delay
      setTimeout(() => {
        this.isLoadingStockMovements = false;
      }, 1200);
    }
  }

  resetForms(): void {
    this.cycleForm.reset();
    this.categoryForm.reset();
    this.brandForm.reset();
    this.stockMovementForm.patchValue({
      type: 'in',
      date: new Date().toISOString().split('T')[0]
    });
    this.selectedCycle = null;
    this.selectedCycleType = null;
    this.selectedBrand = null;
    this.errorMessage = '';
  }

  // Cycle methods
  addCycle(): void {
    if (this.cycleForm.valid) {
      const newId = this.cycles.length > 0 ? Math.max(...this.cycles.map(c => c.id)) + 1 : 1;
      const newCycle: Cycle = {
        id: newId,
        ...this.cycleForm.value
      };
      this.cycles.push(newCycle);
      this.resetForms();
    }
  }

  editCycle(cycle: Cycle): void {
    this.selectedCycle = cycle;
    this.cycleForm.patchValue({
      name: cycle.name,
      category: cycle.category,
      brand: cycle.brand,
      price: cycle.price,
      stock: cycle.stock,
      image: cycle.image || '',
      description: cycle.description || ''
    });
  }

  updateCycle(): void {
    if (this.cycleForm.valid && this.selectedCycle) {
      const index = this.cycles.findIndex(c => c.id === this.selectedCycle!.id);
      if (index !== -1) {
        this.cycles[index] = {
          ...this.selectedCycle,
          ...this.cycleForm.value
        };
        this.resetForms();
      }
    }
  }

  deleteCycle(cycle: Cycle): void {
    if (confirm(`Are you sure you want to delete ${cycle.name}?`)) {
      this.cycles = this.cycles.filter(c => c.id !== cycle.id);
      if (this.selectedCycle?.id === cycle.id) {
        this.resetForms();
      }
    }
  }

  // Cycle Type methods (previously Category methods)
  addCycleType(): void {
    if (this.categoryForm.valid) {
      this.errorMessage = '';
      const newCycleType = {
        typeName: this.categoryForm.value.typeName,
        description: this.categoryForm.value.description
      };
      
      this.cycleTypeService.createCycleType(newCycleType).subscribe({
        next: (response) => {
          this.cycleTypes.push(response);
          this.resetForms();
        },
        error: (error) => {
          console.error('Error creating cycle type:', error);
          this.errorMessage = 'Failed to create category. Please try again.';
        }
      });
    }
  }

  editCycleType(cycleType: ICycleType): void {
    this.selectedCycleType = cycleType;
    this.categoryForm.patchValue({
      typeName: cycleType.typeName,
      description: cycleType.description || ''
    });
  }

  updateCycleType(): void {
    if (this.categoryForm.valid && this.selectedCycleType) {
      this.errorMessage = '';
      const updatedCycleType = {
        typeName: this.categoryForm.value.typeName,
        description: this.categoryForm.value.description
      };
      
      this.cycleTypeService.updateCycleType(this.selectedCycleType.typeId, updatedCycleType).subscribe({
        next: (response) => {
          const index = this.cycleTypes.findIndex(ct => ct.typeId === this.selectedCycleType!.typeId);
          if (index !== -1) {
            this.cycleTypes[index] = response;
          }
          this.resetForms();
        },
        error: (error) => {
          console.error('Error updating cycle type:', error);
          this.errorMessage = 'Failed to update category. Please try again.';
        }
      });
    }
  }

  deleteCycleType(cycleType: ICycleType): void {
    if (confirm(`Are you sure you want to delete ${cycleType.typeName}?`)) {
      this.errorMessage = '';
      
      this.cycleTypeService.deleteCycleType(cycleType.typeId).subscribe({
        next: () => {
          this.cycleTypes = this.cycleTypes.filter(ct => ct.typeId !== cycleType.typeId);
          if (this.selectedCycleType?.typeId === cycleType.typeId) {
            this.resetForms();
          }
        },
        error: (error) => {
          console.error('Error deleting cycle type:', error);
          this.errorMessage = 'Failed to delete category. It may be in use by cycles.';
        }
      });
    }
  }

  // Brand methods
  addBrand(): void {
    if (this.brandForm.valid) {
      const newId = this.brands.length > 0 ? Math.max(...this.brands.map(b => b.id)) + 1 : 1;
      const newBrand: Brand = {
        id: newId,
        name: this.brandForm.value.name
      };
      this.brands.push(newBrand);
      this.resetForms();
    }
  }

  editBrand(brand: Brand): void {
    this.selectedBrand = brand;
    this.brandForm.patchValue({
      name: brand.name
    });
  }

  updateBrand(): void {
    if (this.brandForm.valid && this.selectedBrand) {
      const index = this.brands.findIndex(b => b.id === this.selectedBrand!.id);
      if (index !== -1) {
        this.brands[index] = {
          ...this.selectedBrand,
          ...this.brandForm.value
        };
        this.resetForms();
      }
    }
  }

  deleteBrand(brand: Brand): void {
    if (confirm(`Are you sure you want to delete ${brand.name}?`)) {
      this.brands = this.brands.filter(b => b.id !== brand.id);
      if (this.selectedBrand?.id === brand.id) {
        this.resetForms();
      }
    }
  }

  // Stock Movement methods
  addStockMovement(): void {
    if (this.stockMovementForm.valid) {
      const cycleId = this.stockMovementForm.value.cycleId;
      const cycle = this.cycles.find(c => c.id === Number(cycleId));
      
      if (cycle) {
        const newId = this.stockMovements.length > 0 ? Math.max(...this.stockMovements.map(sm => sm.id)) + 1 : 1;
        const newMovement: StockMovement = {
          id: newId,
          cycleId: Number(cycleId),
          cycleName: cycle.name,
          type: this.stockMovementForm.value.type,
          quantity: this.stockMovementForm.value.quantity,
          date: this.stockMovementForm.value.date,
          notes: this.stockMovementForm.value.notes
        };
        
        this.stockMovements.push(newMovement);
        
        // Update cycle stock
        if (newMovement.type === 'in') {
          cycle.stock += newMovement.quantity;
        } else {
          cycle.stock -= newMovement.quantity;
          if (cycle.stock < 0) cycle.stock = 0;
        }
        
        this.resetForms();
      }
    }
  }

  deleteStockMovement(movement: StockMovement): void {
    if (confirm(`Are you sure you want to delete this stock movement?`)) {
      this.stockMovements = this.stockMovements.filter(sm => sm.id !== movement.id);
      
      // Revert stock change
      const cycle = this.cycles.find(c => c.id === movement.cycleId);
      if (cycle) {
        if (movement.type === 'in') {
          cycle.stock -= movement.quantity;
          if (cycle.stock < 0) cycle.stock = 0;
        } else {
          cycle.stock += movement.quantity;
        }
      }
    }
  }
}
