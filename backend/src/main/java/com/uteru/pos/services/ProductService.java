package com.uteru.pos.services;

import com.uteru.pos.models.Category;
import com.uteru.pos.models.Product;
import com.uteru.pos.repositories.CategoryRepository;
import com.uteru.pos.repositories.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Product> getAllActiveProducts() {
        return productRepository.findByIsActiveTrueOrderByIdAsc();
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }
}
