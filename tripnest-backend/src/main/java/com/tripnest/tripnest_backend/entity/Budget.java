package com.tripnest.tripnest_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "budgets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "budget_id")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false, unique = true)
    private Trip trip;

    @Column(name = "total_budget", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalBudget = BigDecimal.ZERO;

    @Column(name = "spent_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "INR";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    public BigDecimal getRemainingAmount() {
        BigDecimal total = this.totalBudget != null ? this.totalBudget : BigDecimal.ZERO;
        BigDecimal spent = this.spentAmount != null ? this.spentAmount : BigDecimal.ZERO;
        return total.subtract(spent);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.spentAmount == null) {
            this.spentAmount = BigDecimal.ZERO;
        }
        if (this.totalBudget == null) {
            this.totalBudget = BigDecimal.ZERO;
        }
        if (this.currency == null || this.currency.isBlank()) {
            this.currency = "INR";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.currency == null || this.currency.isBlank()) {
            this.currency = "INR";
        }
    }
}
