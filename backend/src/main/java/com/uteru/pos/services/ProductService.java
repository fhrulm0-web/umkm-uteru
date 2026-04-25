package com.uteru.pos.services;

import com.uteru.pos.models.Category;
import com.uteru.pos.models.Product;
import com.uteru.pos.repositories.CategoryRepository;
import com.uteru.pos.repositories.ProductRepository;
import com.uteru.pos.validation.InputSanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
        product.setName(InputSanitizer.cleanText(product.getName()));
        product.setDescription(InputSanitizer.cleanNullableText(product.getDescription()));
        product.setIcon(InputSanitizer.cleanNullableText(product.getIcon()));
        product.setPackName(InputSanitizer.cleanNullableText(product.getPackName()));
        if (product.getPcsPerPack() == null) {
            product.setPcsPerPack(1);
        }
        if (product.getCurrentStockPcs() == null) {
            product.setCurrentStockPcs(0);
        }
        if (product.getIsActive() == null) {
            product.setIsActive(true);
        }
        if (product.getIsCustomPrice() == null) {
            product.setIsCustomPrice(false);
        }
        if (product.getTrackStock() == null) {
            product.setTrackStock(false);
        }
        if (product.getCategory() != null && product.getCategory().getId() != null) {
            Category category = categoryRepository.findById(product.getCategory().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
            product.setCategory(category);
        }
        return productRepository.save(product);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(Category category) {
        category.setName(InputSanitizer.cleanText(category.getName()));
        return categoryRepository.save(category);
    }
}
