package com.uteru.pos.controllers;

import com.uteru.pos.models.StockLog;
import com.uteru.pos.models.Transaction;
import com.uteru.pos.models.Product;
import com.uteru.pos.payload.MasterStockRequest;
import com.uteru.pos.payload.StockInputRequest;
import com.uteru.pos.services.PosService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pos")
@Validated
public class PosController {

    private final PosService posService;

    public PosController(PosService posService) {
        this.posService = posService;
    }

    @PostMapping("/checkout")
    public Transaction checkout(@Valid @RequestBody Transaction transaction) {
        return posService.processCheckout(transaction);
    }

    @PostMapping("/stock/morning")
    public StockLog inputMorningStock(@Valid @RequestBody StockInputRequest request) {
        return posService.inputMorningStock(request);
    }

    @PostMapping("/stock/night")
    public StockLog inputNightStock(@Valid @RequestBody StockInputRequest request) {
        return posService.inputNightStock(request);
    }

    @PostMapping("/stock/master")
    public Product updateMasterStock(@Valid @RequestBody MasterStockRequest request) {
        return posService.updateMasterStock(request);
    }

    @GetMapping("/transactions")
    public List<Transaction> getTransactions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from date must not be after to date");
        }
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.atTime(23, 59, 59);
        return posService.getTransactionsByDateRange(start, end);
    }

    @GetMapping("/stock/logs")
    public List<StockLog> getStockLogs(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return posService.getStockLogsByDate(date);
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable @Positive Long id) {
        posService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}
