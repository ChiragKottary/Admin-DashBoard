import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CycleTypeService } from '../services/cycle-type.service';
import { BrandService } from '../services/brand.service';
import { CycleService } from '../services/cycle.service';
import { StockService } from '../services/stock.service';
import { ICycleType, IBrand, ICycle, IStockMovement, MovementType, IStockAdjustmentRequest } from '../app.models';
import { trigger, transition, style, animate } from '@angular/animations';

// Local interfaces for the component
interface Cycle {
  cycleId: string;
  modelName: string;
  brandId: string;
  typeId: string;
  description?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  imageUrl?: string;
  isActive: boolean;
  warrantyMonths: number;
  createdAt: string;
  updatedAt: string;
  category?: string;
  brand?: string;
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
  providers: [CycleTypeService, BrandService, CycleService, StockService],
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
  @ViewChild('cycleFormSection') cycleFormSection!: ElementRef;
  @ViewChild('categoryFormSection') categoryFormSection!: ElementRef;
  @ViewChild('brandFormSection') brandFormSection!: ElementRef;
  @ViewChild('stockFormSection') stockFormSection!: ElementRef;
  
  // Make Math available to the template
  protected readonly Math = Math;
  
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
  apiCycles: ICycle[] = [];
  cycles: Cycle[] = [];
  
  cycleTypes: ICycleType[] = [];
  
  // Initialize brands as empty array, data will be loaded from API
  brands: IBrand[] = [];
  
  stockMovements: IStockMovement[] = [];
  
  // Selected item for editing
  selectedCycle: Cycle | null = null;
  selectedApiCycle: ICycle | null = null;
  selectedCycleType: ICycleType | null = null;
  selectedBrand: IBrand | null = null;
  
  // Error message
  errorMessage: string = '';

  // Pagination properties for cycles
  cyclesPage: number = 1;
  cyclesPageSize: number = 7; // Match the API's default page size
  cyclesTotal: number = 0;
  cyclesTotalPages: number = 0;
  hasMoreCyclesPages: boolean = false;
  hasPrevCyclesPages: boolean = false;
  
  // Pagination properties for cycle types
  cycleTypesPage: number = 1;
  cycleTypesPageSize: number = 10;
  cycleTypesTotal: number = 0;
  cycleTypesTotalPages: number = 0;
  
  // Pagination properties for brands
  brandsPage: number = 1;
  brandsPageSize: number = 10;
  brandsTotal: number = 0;
  brandsTotalPages: number = 0;
  
  // Pagination properties for stock movements
  stockMovementsPage: number = 1;
  stockMovementsPageSize: number = 7;
  stockMovementsTotal: number = 0;
  stockMovementsTotalPages: number = 0;
  
  // Display data (paginated)
  displayCycles: Cycle[] = [];
  displayCycleTypes: ICycleType[] = [];
  displayBrands: IBrand[] = [];
  displayStockMovements: IStockMovement[] = [];

  // Add a new property to hold all cycles for stock movement dropdown
  allCyclesForStock: ICycle[] = [];

  constructor(
    private fb: FormBuilder,
    private cycleTypeService: CycleTypeService,
    private brandService: BrandService,
    private cycleService: CycleService,
    private stockService: StockService
  ) {
    // Initialize forms
    this.cycleForm = this.fb.group({
      modelName: ['', Validators.required],
      brandId: ['', Validators.required],
      typeId: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [5, [Validators.required, Validators.min(1)]],
      imageUrl: [''],
      warrantyMonths: [0, [Validators.min(0)]]
    });
    
    this.categoryForm = this.fb.group({
      typeName: ['', Validators.required],
      description: ['', Validators.required]
    });
    
    this.brandForm = this.fb.group({
      brandName: ['', Validators.required],
      description: ['', Validators.required]
    });
    
    this.stockMovementForm = this.fb.group({
      cycleId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      movementType: ['0', Validators.required], // 0 for StockIn, 1 for StockOut
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadCycles();
    this.loadCycleTypes();
    this.loadBrands();
    this.loadStockMovements();
    this.loadAllCyclesForStock(); // Load all cycles for stock movement dropdown
  }

  // Load cycles from API with pagination
  loadCycles(): void {
    this.isLoadingCycles = true;
    this.errorMessage = '';
    
    // Ensure page number is valid
    if (this.cyclesPage < 1) {
      this.cyclesPage = 1;
    }
    
    this.cycleService.getAllCycles(this.cyclesPage, this.cyclesPageSize).subscribe({
      next: (response) => {
        // Store the API response
        this.apiCycles = response.items;
        
        // Map API cycles to the local cycle format for display
        this.cycles = response.items.map(cycle => ({
          cycleId: cycle.cycleId,
          modelName: cycle.modelName,
          brandId: cycle.brandId,
          typeId: cycle.typeId,
          description: cycle.description,
          price: cycle.price,
          costPrice: cycle.costPrice,
          stockQuantity: cycle.stockQuantity,
          reorderLevel: cycle.reorderLevel,
          imageUrl: cycle.imageUrl,
          isActive: cycle.isActive,
          warrantyMonths: cycle.warrantyMonths,
          createdAt: cycle.createdAt.toString(),
          updatedAt: cycle.updatedAt.toString(),
          category: cycle.cycleType?.typeName || '',
          brand: cycle.brand?.brandName || ''
        }));
        
        // Update pagination data
        this.cyclesTotal = response.totalItems;
        this.cyclesTotalPages = response.totalPages;
        this.hasMoreCyclesPages = response.hasNext;
        this.hasPrevCyclesPages = response.hasPrevious;
        
        // Update display cycles with the current page data
        this.displayCycles = [...this.cycles];
        
        this.isLoadingCycles = false;
      },
      error: (error) => {
        console.error('Error fetching cycles:', error);
        this.errorMessage = 'Failed to load cycles. Please try again later.';
        this.isLoadingCycles = false;
      }
    });
  }

  // New method to load all cycles for stock movement dropdown
  loadAllCyclesForStock(): void {
    // Use the existing pagination endpoint but with a large page size to get all cycles at once
    this.cycleService.getAllCycles(1, 1000).subscribe({
      next: (response) => {
        this.allCyclesForStock = response.items;
      },
      error: (error) => {
        console.error('Error fetching all cycles for stock:', error);
        this.errorMessage = 'Failed to load cycles for stock movement.';
      }
    });
  }

  // Load cycle types from API
  loadCycleTypes(): void {
    this.isLoadingCycleTypes = true;
    this.errorMessage = '';
    
    this.cycleTypeService.getAllCycleTypes(this.cycleTypesPage, this.cycleTypesPageSize).subscribe({
      next: (response) => {
        // Update the display data
        this.displayCycleTypes = response.items;
        
        // Update pagination information
        this.cycleTypesTotal = response.totalItems;
        this.cycleTypesTotalPages = response.totalPages;
        
        this.isLoadingCycleTypes = false;
      },
      error: (error) => {
        console.error('Error fetching cycle types:', error);
        this.errorMessage = 'Failed to load categories. Please try again later.';
        this.isLoadingCycleTypes = false;
      }
    });
  }

  // Load brands from API
  loadBrands(): void {
    this.isLoadingBrands = true;
    this.errorMessage = '';
    
    this.brandService.getAllBrands().subscribe({
      next: (data) => {
        this.brands = data;
        
        // Set up pagination
        this.brandsTotal = this.brands.length;
        this.updateBrandsPagination();
        this.isLoadingBrands = false;
      },
      error: (error) => {
        console.error('Error fetching brands:', error);
        this.errorMessage = 'Failed to load brands. Please try again later.';
        this.isLoadingBrands = false;
      }
    });
  }

  // Load stock movements
  loadStockMovements(): void {
    this.isLoadingStockMovements = true;
    this.stockService.getStockMovements(this.stockMovementsPage, this.stockMovementsPageSize)
      .subscribe({
        next: (response) => {
          this.stockMovements = response.items;
          this.displayStockMovements = response.items;
          this.stockMovementsTotal = response.totalItems;
          this.stockMovementsTotalPages = response.totalPages;
          this.isLoadingStockMovements = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load stock movements. Please try again.';
      this.isLoadingStockMovements = false;
        }
      });
  }

  // Pagination update methods
  updateCycleTypesPagination(): void {
    const startIndex = (this.cycleTypesPage - 1) * this.cycleTypesPageSize;
    const endIndex = Math.min(startIndex + this.cycleTypesPageSize, this.cycleTypes.length);
    this.displayCycleTypes = this.cycleTypes.slice(startIndex, endIndex);
  }

  updateBrandsPagination(): void {
    const startIndex = (this.brandsPage - 1) * this.brandsPageSize;
    const endIndex = Math.min(startIndex + this.brandsPageSize, this.brands.length);
    this.displayBrands = this.brands.slice(startIndex, endIndex);
  }

  updateStockMovementsPagination(): void {
    const startIndex = (this.stockMovementsPage - 1) * this.stockMovementsPageSize;
    const endIndex = Math.min(startIndex + this.stockMovementsPageSize, this.stockMovements.length);
    this.displayStockMovements = this.stockMovements.slice(startIndex, endIndex);
  }

  // Page change handlers
  changeCyclesPage(page: number): void {
    if (page !== this.cyclesPage && page >= 1 && page <= this.cyclesTotalPages) {
      console.log(`Changing page from ${this.cyclesPage} to ${page}`);
    this.cyclesPage = page;
      this.loadCycles();
    }
  }

  changeCycleTypesPage(page: number): void {
    if (page !== this.cycleTypesPage && page >= 1 && page <= this.cycleTypesTotalPages) {
      this.cycleTypesPage = page;
      this.loadCycleTypes();
    }
  }

  changeBrandsPage(page: number): void {
    this.brandsPage = page;
    this.updateBrandsPagination();
  }

  changeStockMovementsPage(page: number): void {
    this.stockMovementsPage = page;
    this.loadStockMovements();
  }

  setActiveTab(tab: 'cycles' | 'categories' | 'brands' | 'stock'): void {
    this.activeTab = tab;
    this.resetForms();
    
    // Load data based on selected tab
    if (tab === 'categories') {
      this.loadCycleTypes();
    } else if (tab === 'cycles') {
      this.loadCycles();
    } else if (tab === 'brands') {
      this.loadBrands();
    } else if (tab === 'stock') {
      this.loadStockMovements();
    }
  }

  resetForms(): void {
    this.cycleForm.reset();
    this.categoryForm.reset();
    this.brandForm.reset();
    this.stockMovementForm.patchValue({
      quantity: '',
      movementType: '0',
      notes: ''
    });
    this.selectedCycle = null;
    this.selectedApiCycle = null;
    this.selectedCycleType = null;
    this.selectedBrand = null;
    this.errorMessage = '';
  }

  // Cycle methods
  addCycle(): void {
    if (this.cycleForm.valid) {
      this.errorMessage = '';
      
      // Create cycle object from form values
      const newCycle = {
        ...this.cycleForm.value,
        isActive: true
      };
      
      this.cycleService.createCycle(newCycle).subscribe({
        next: (response) => {
          // Add the new cycle to the apiCycles array
          this.apiCycles.push(response);
          
          // Create a display cycle for UI
          const displayCycle: Cycle = {
            cycleId: response.cycleId,
            modelName: response.modelName,
            brandId: response.brandId,
            typeId: response.typeId,
            description: response.description,
            price: response.price,
            costPrice: response.costPrice,
            stockQuantity: response.stockQuantity,
            reorderLevel: response.reorderLevel,
            imageUrl: response.imageUrl,
            isActive: response.isActive,
            warrantyMonths: response.warrantyMonths,
            createdAt: response.createdAt.toString(),
            updatedAt: response.updatedAt.toString(),
            category: response.cycleType?.typeName || '',
            brand: response.brand?.brandName || ''
          };
          
          this.cycles.push(displayCycle);
          this.resetForms();
        },
        error: (error) => {
          console.error('Error creating cycle:', error);
          this.errorMessage = 'Failed to create cycle. Please try again.';
        }
      });
    }
  }

  editCycle(cycle: Cycle): void {
    this.selectedCycle = cycle;
    // Find the corresponding API cycle
    const apiCycle = this.apiCycles.find(c => c.cycleId === cycle.cycleId);
    
    if (apiCycle) {
      this.selectedApiCycle = apiCycle;
      this.cycleForm.patchValue({
        modelName: apiCycle.modelName,
        brandId: apiCycle.brandId,
        typeId: apiCycle.typeId,
        description: apiCycle.description,
        price: apiCycle.price,
        costPrice: apiCycle.costPrice,
        stockQuantity: apiCycle.stockQuantity,
        reorderLevel: apiCycle.reorderLevel,
        imageUrl: apiCycle.imageUrl,
        warrantyMonths: apiCycle.warrantyMonths
      });
    }
  }

  updateCycle(): void {
    if (this.cycleForm.valid && this.selectedCycle && this.selectedApiCycle) {
      this.errorMessage = '';
      
      // Create updated cycle object from form values
      const updatedCycle = {
        ...this.selectedApiCycle,
        ...this.cycleForm.value
      };
      
      this.cycleService.updateCycle(this.selectedApiCycle.cycleId, updatedCycle).subscribe({
        next: (response) => {
          // Update the API cycles array
          const apiIndex = this.apiCycles.findIndex(c => c.cycleId === this.selectedApiCycle!.cycleId);
          if (apiIndex !== -1) {
            this.apiCycles[apiIndex] = response;
          }
          
          // Update the display cycles array
          const displayIndex = this.displayCycles.findIndex(c => c.cycleId === this.selectedCycle!.cycleId);
          if (displayIndex !== -1) {
            this.displayCycles[displayIndex] = {
              cycleId: response.cycleId,
              modelName: response.modelName,
              brandId: response.brandId,
              typeId: response.typeId,
              description: response.description,
              price: response.price,
              costPrice: response.costPrice,
              stockQuantity: response.stockQuantity,
              reorderLevel: response.reorderLevel,
              imageUrl: response.imageUrl,
              isActive: response.isActive,
              warrantyMonths: response.warrantyMonths,
              createdAt: response.createdAt.toString(),
              updatedAt: response.updatedAt.toString(),
              category: response.cycleType?.typeName || '',
              brand: response.brand?.brandName || ''
            };
          }
          
          // Also update the cycles array
          const cyclesIndex = this.cycles.findIndex(c => c.cycleId === this.selectedCycle!.cycleId);
          if (cyclesIndex !== -1) {
            this.cycles[cyclesIndex] = this.displayCycles[displayIndex];
          }
          
          this.resetForms();
        },
        error: (error) => {
          console.error('Error updating cycle:', error);
          this.errorMessage = 'Failed to update cycle. Please try again.';
        }
      });
    }
  }

  deleteCycle(cycle: Cycle): void {
    if (confirm(`Are you sure you want to delete ${cycle.modelName}?`)) {
      this.errorMessage = '';
      
      // Find the corresponding API cycle
      const apiCycle = this.apiCycles.find(c => c.cycleId === cycle.cycleId);
      
      if (apiCycle) {
        this.cycleService.deleteCycle(apiCycle.cycleId).subscribe({
          next: () => {
            // Remove from API cycles array
            this.apiCycles = this.apiCycles.filter(c => c.cycleId !== apiCycle.cycleId);
            
            // Remove from cycles array
            this.cycles = this.cycles.filter(c => c.cycleId !== cycle.cycleId);
            
            // Remove from display cycles array
            this.displayCycles = this.displayCycles.filter(c => c.cycleId !== cycle.cycleId);
            
            if (this.selectedCycle?.cycleId === cycle.cycleId) {
              this.resetForms();
            }
          },
          error: (error) => {
            console.error('Error deleting cycle:', error);
            this.errorMessage = 'Failed to delete cycle. It may be referenced by orders or stock movements.';
          }
        });
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
          this.loadCycleTypes(); // Reload the current page
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
        typeId: this.selectedCycleType.typeId,
        typeName: this.categoryForm.value.typeName,
        description: this.categoryForm.value.description
      };
      
      this.cycleTypeService.updateCycleType(this.selectedCycleType.typeId, updatedCycleType).subscribe({
        next: (response) => {
          this.loadCycleTypes(); // Reload the current page
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
          this.loadCycleTypes(); // Reload the current page
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
      this.errorMessage = '';
      const newBrand = {
        brandName: this.brandForm.value.brandName,
        description: this.brandForm.value.description
      };
      
      this.brandService.createBrand(newBrand).subscribe({
        next: (response) => {
          // Update both arrays and refresh display
          this.brands.push(response);
          this.updateBrandsPagination();
          this.displayBrands = this.brands.slice(
            (this.brandsPage - 1) * this.brandsPageSize,
            this.brandsPage * this.brandsPageSize
          );
          this.resetForms();
        },
        error: (error) => {
          console.error('Error creating brand:', error);
          this.errorMessage = 'Failed to create brand. Please try again.';
        }
      });
    }
  }

  editBrand(brand: IBrand): void {
    this.selectedBrand = brand;
    this.brandForm.patchValue({
      brandName: brand.brandName,
      description: brand.description || ''
    });
  }

  updateBrand(): void {
    if (this.brandForm.valid && this.selectedBrand) {
      this.errorMessage = '';
      const updatedBrand = {
        brandId: this.selectedBrand.brandId, // Include the ID
        brandName: this.brandForm.value.brandName,
        description: this.brandForm.value.description
      };
      
      this.brandService.updateBrand(this.selectedBrand.brandId, updatedBrand).subscribe({
        next: (response) => {
          const index = this.brands.findIndex(b => b.brandId === this.selectedBrand!.brandId);
          if (index !== -1) {
            this.brands[index] = response;
            // Update display array
            this.updateBrandsPagination();
            this.displayBrands = this.brands.slice(
              (this.brandsPage - 1) * this.brandsPageSize,
              this.brandsPage * this.brandsPageSize
            );
          }
          this.resetForms();
        },
        error: (error) => {
          console.error('Error updating brand:', error);
          this.errorMessage = 'Failed to update brand. Please try again.';
        }
      });
    }
  }

  deleteBrand(brand: IBrand): void {
    if (confirm(`Are you sure you want to delete ${brand.brandName}?`)) {
      this.errorMessage = '';
      
      this.brandService.deleteBrand(brand.brandId).subscribe({
        next: () => {
          // Update the brands array
          this.brands = this.brands.filter(b => b.brandId !== brand.brandId);
          
          // Update the display brands array
          this.displayBrands = this.displayBrands.filter(b => b.brandId !== brand.brandId);
          
          // Recalculate pagination
          this.brandsTotal = this.brands.length;
          this.updateBrandsPagination();
          
          if (this.selectedBrand?.brandId === brand.brandId) {
            this.resetForms();
          }
        },
        error: (error) => {
          console.error('Error deleting brand:', error);
          this.errorMessage = 'Failed to delete brand. It may be in use by cycles.';
        }
      });
    }
  }

  // Stock Movement methods
  addStockMovement(): void {
    if (this.stockMovementForm.valid) {
      const formValue = this.stockMovementForm.value;
      const cycleId = formValue.cycleId;
      const quantity = formValue.quantity;
      const movementType = parseInt(formValue.movementType);
      const notes = formValue.notes || '';

      // Use the enhanced method that automatically gets the userId from the logged-in user
      this.stockService.createStockMovement(cycleId, quantity, movementType, notes).subscribe({
        next: (response) => {
          this.loadStockMovements();
          this.loadCycles(); // Refresh cycles to update stock quantities
          this.resetForms();
          // Show success message or notification
          this.errorMessage = '';
        },
        error: (error) => {
          console.error('Failed to add stock movement:', error);
          this.errorMessage = 'Failed to add stock movement. Please try again.';
        }
      });
    }
  }

  deleteStockMovement(movement: IStockMovement): void {
    if (confirm('Are you sure you want to delete this stock movement?')) {
      this.stockService.deleteStockMovement(movement.movementId).subscribe({
        next: () => {
          this.loadStockMovements();
          this.loadCycles(); // Refresh cycles to update stock quantities
          // Show success message or notification
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete stock movement. Please try again.';
        }
      });
    }
  }

  // Add these new methods after the existing pagination methods
  
  // Cycle Types (Categories) pagination methods
  getCycleTypesPageNumbers(): number[] {
    const totalPages = this.cycleTypesTotalPages;
    const currentPage = this.cycleTypesPage;
    
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    
    if (currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    }
    
    return Array.from({ length: 5 }, (_, i) => currentPage - 2 + i);
  }

  getCycleTypesTotalPages(): number {
    return Math.ceil(this.cycleTypesTotal / this.cycleTypesPageSize);
  }

  updateCycleTypesPageSize(newSize: string): void {
    const size = parseInt(newSize);
    if (size !== this.cycleTypesPageSize) {
      this.cycleTypesPageSize = size;
      this.cycleTypesPage = 1; // Reset to first page
      this.loadCycleTypes();
    }
  }

  // Brands pagination methods
  getBrandsPageNumbers(): number[] {
    const totalPages = this.getBrandsTotalPages();
    const currentPage = this.brandsPage;
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  getBrandsTotalPages(): number {
    return Math.ceil(this.brandsTotal / this.brandsPageSize);
  }

  updateBrandsPageSize(newSize: string): void {
    const size = parseInt(newSize, 10);
    if (!isNaN(size) && size > 0) {
      this.brandsPageSize = size;
      this.brandsPage = 1;
      this.updateBrandsPagination();
    }
  }

  // Stock Movements pagination methods
  getStockMovementsPageNumbers(): number[] {
    const totalPages = Math.ceil(this.stockMovementsTotal / this.stockMovementsPageSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  getStockMovementsTotalPages(): number {
    return Math.ceil(this.stockMovementsTotal / this.stockMovementsPageSize);
  }

  updateStockMovementsPageSize(newSize: string): void {
    this.stockMovementsPageSize = parseInt(newSize);
    this.stockMovementsPage = 1;
    this.loadStockMovements();
  }

  // Cycles pagination methods
  getPageNumbers(): number[] {
    const totalPages = this.cyclesTotalPages;
    const currentPage = this.cyclesPage;
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  goToFirstPage(): void {
    if (this.cyclesPage !== 1) {
      this.cyclesPage = 1;
      this.loadCycles();
    }
  }

  goToLastPage(): void {
    if (this.cyclesPage !== this.cyclesTotalPages) {
      this.cyclesPage = this.cyclesTotalPages;
      this.loadCycles();
    }
  }

  goToNextPage(): void {
    if (this.hasMoreCyclesPages) {
      console.log(`Going to next page: ${this.cyclesPage + 1}`);
      this.cyclesPage++;
      this.loadCycles();
    }
  }

  goToPreviousPage(): void {
    if (this.hasPrevCyclesPages) {
      console.log(`Going to previous page: ${this.cyclesPage - 1}`);
      this.cyclesPage--;
      this.loadCycles();
    }
  }

  updatePageSize(newSize: string): void {
    const size = parseInt(newSize, 10);
    if (!isNaN(size) && size > 0 && size !== this.cyclesPageSize) {
      console.log(`Changing page size from ${this.cyclesPageSize} to ${size}`);
      this.cyclesPageSize = size;
      this.cyclesPage = 1; // Reset to first page when changing page size
      this.loadCycles();
    }
  }

  getMovementTypeLabel(type: MovementType): string {
    switch (type) {
      case MovementType.StockIn:
        return 'Stock In';
      case MovementType.StockOut:
        return 'Stock Out';
      case MovementType.InitialStock:
        return 'Initial Stock';
      case MovementType.Adjustment:
        return 'Adjustment';
      case MovementType.Return:
        return 'Return';
      case MovementType.Damaged:
        return 'Damaged';
      default:
        return 'Unknown';
    }
  }

  scrollToForm(formType: 'cycle' | 'category' | 'brand' | 'stock'): void {
    this.resetForms();
    
    setTimeout(() => {
      let targetElement: ElementRef;
      
      switch(formType) {
        case 'cycle':
          targetElement = this.cycleFormSection;
          break;
        case 'category':
          targetElement = this.categoryFormSection;
          this.setActiveTab('categories');
          break;
        case 'brand':
          targetElement = this.brandFormSection;
          this.setActiveTab('brands');
          break;
        case 'stock':
          targetElement = this.stockFormSection;
          this.setActiveTab('stock');
          break;
      }
      
      targetElement.nativeElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }
}
