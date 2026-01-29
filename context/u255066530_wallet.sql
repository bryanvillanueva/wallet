-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jan 29, 2026 at 09:16 PM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u255066530_wallet`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `type` enum('cash','bank','credit','savings') NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'AUD',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `user_id`, `name`, `type`, `currency`, `is_active`, `created_at`) VALUES
(1, 1, 'Cuenta Corriente', 'bank', 'AUD', 0, '2025-10-09 06:23:51'),
(2, 1, 'Tarjeta Crédito', 'credit', 'AUD', 1, '2025-10-09 06:23:51'),
(3, 1, 'Ahorros', 'savings', 'AUD', 1, '2025-10-09 06:23:51'),
(4, 2, 'Cuenta Corriente', 'bank', 'AUD', 1, '2025-10-09 06:23:51');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `kind` enum('income','expense','transfer','adjustment') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `user_id`, `name`, `kind`) VALUES
(1, NULL, 'Nómina', 'income'),
(2, NULL, 'Reembolso compartido', 'adjustment'),
(3, NULL, 'Servicios', 'expense'),
(4, NULL, 'Renta', 'expense'),
(5, NULL, 'Supermercado', 'expense'),
(6, NULL, 'Transporte', 'expense'),
(7, NULL, 'Tarjeta Crédito Pago', 'expense'),
(8, NULL, 'Transferencia', 'transfer'),
(9, 1, 'Gasolina', 'expense'),
(10, 1, 'Entretenimiento', 'expense'),
(11, 1, 'Servicios de Ai', 'expense'),
(12, 1, 'College', 'expense'),
(13, 1, 'Remitly', 'transfer'),
(14, 2, 'Cuidado Personal', 'expense');

-- --------------------------------------------------------

--
-- Table structure for table `pay_periods`
--

CREATE TABLE `pay_periods` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `pay_date` date NOT NULL,
  `gross_income_cents` bigint(20) NOT NULL DEFAULT 0,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pay_periods`
--

INSERT INTO `pay_periods` (`id`, `user_id`, `pay_date`, `gross_income_cents`, `note`, `created_at`) VALUES
(2, 1, '2025-08-26', 0, 'Histórico', '2025-10-09 06:23:51'),
(3, 1, '2025-09-09', 0, 'Histórico', '2025-10-09 06:23:51'),
(4, 1, '2025-09-23', 0, 'Histórico', '2025-10-09 06:23:51'),
(5, 1, '2025-10-07', 0, 'Histórico', '2025-10-09 06:23:51'),
(6, 1, '2025-11-18', 193400, NULL, '2025-11-18 08:36:11'),
(7, 1, '2026-01-27', 194152, NULL, '2026-01-28 06:57:31');

-- --------------------------------------------------------

--
-- Table structure for table `planned_payments`
--

CREATE TABLE `planned_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `amount_cents` bigint(20) NOT NULL,
  `due_date` date NOT NULL,
  `auto_debit` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('planned','executed','canceled') NOT NULL DEFAULT 'planned',
  `linked_txn_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `saving_entries`
--

CREATE TABLE `saving_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `pay_period_id` bigint(20) UNSIGNED DEFAULT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `amount_cents` bigint(20) NOT NULL,
  `entry_date` date NOT NULL,
  `note` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `saving_entries`
--

INSERT INTO `saving_entries` (`id`, `user_id`, `pay_period_id`, `account_id`, `amount_cents`, `entry_date`, `note`, `created_at`) VALUES
(1, 1, 7, 3, 20000, '2026-01-28', 'Ahorro de la primera quincena de enero', '2026-01-28 08:55:46');

-- --------------------------------------------------------

--
-- Table structure for table `saving_entry_goals`
--

CREATE TABLE `saving_entry_goals` (
  `saving_entry_id` bigint(20) UNSIGNED NOT NULL,
  `goal_id` bigint(20) UNSIGNED NOT NULL,
  `amount_cents` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `saving_entry_goals`
--

INSERT INTO `saving_entry_goals` (`saving_entry_id`, `goal_id`, `amount_cents`) VALUES
(1, 1, 20000);

-- --------------------------------------------------------

--
-- Table structure for table `saving_goals`
--

CREATE TABLE `saving_goals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(140) NOT NULL,
  `target_amount_cents` bigint(20) NOT NULL,
  `target_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `saving_goals`
--

INSERT INTO `saving_goals` (`id`, `user_id`, `name`, `target_amount_cents`, `target_date`, `created_at`) VALUES
(1, 1, 'Renovacion visa', 600000, '2026-07-30', '2026-01-29 09:01:49');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `pay_period_id` bigint(20) UNSIGNED DEFAULT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` enum('income','expense','transfer','adjustment') NOT NULL,
  `amount_cents` bigint(20) NOT NULL,
  `description` varchar(240) DEFAULT NULL,
  `txn_date` date NOT NULL,
  `planned_payment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `counterparty_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `pay_period_id`, `account_id`, `category_id`, `type`, `amount_cents`, `description`, `txn_date`, `planned_payment_id`, `counterparty_user_id`, `created_at`) VALUES
(1, 1, 2, 3, 1, 'income', 179552, 'Nomina', '2025-08-26', NULL, NULL, '2025-11-12 09:04:12'),
(2, 1, 2, 3, 4, 'expense', -54998, 'Renta', '2025-08-26', NULL, NULL, '2025-11-12 09:05:26'),
(3, 1, 2, 3, 12, 'expense', -24998, 'Ahorro para el pago del college', '2025-08-27', NULL, NULL, '2025-11-12 09:07:17'),
(4, 1, 2, 2, 7, 'expense', -13500, NULL, '2025-08-27', NULL, NULL, '2025-11-12 09:08:19'),
(5, 1, 2, 3, 13, 'transfer', -20000, 'Envio a col', '2025-08-27', NULL, NULL, '2025-11-12 09:11:01'),
(6, 1, 2, 3, 11, 'expense', -3500, 'Chat GPT', '2025-08-30', NULL, NULL, '2025-11-12 09:12:13'),
(8, 1, 2, 3, 11, 'expense', -3399, 'Claude', '2025-08-30', NULL, NULL, '2025-11-12 09:14:18'),
(9, 1, 2, 3, 11, 'expense', -800, 'Railway', '2025-09-01', NULL, NULL, '2025-11-12 09:15:32'),
(10, 1, 2, 3, NULL, 'income', 18300, 'Gasolina + Comida', '2025-09-01', NULL, NULL, '2025-11-12 09:17:14'),
(11, 1, 6, 3, NULL, 'expense', -25000, 'College', '2025-11-18', NULL, NULL, '2025-11-18 08:39:04'),
(12, 1, 6, 3, NULL, 'expense', -51600, 'Renta', '2025-11-18', NULL, NULL, '2025-11-18 08:40:39'),
(13, 1, 6, 3, NULL, 'expense', -12200, 'Comida + Gasolina', '2025-11-18', NULL, NULL, '2025-11-18 08:50:43'),
(14, 1, 6, 2, NULL, 'expense', -18000, 'tarjeta de credito', '2025-11-18', NULL, NULL, '2025-11-18 08:51:50'),
(15, 1, 6, 3, NULL, 'expense', -21200, 'envio colombia ', '2025-11-18', NULL, NULL, '2025-11-18 09:00:13'),
(16, 1, 6, 3, NULL, 'transfer', -6200, 'abono junior', '2025-11-18', NULL, NULL, '2025-11-18 09:03:33'),
(17, 1, 7, 3, 9, 'expense', -9633, NULL, '2026-01-28', NULL, NULL, '2026-01-28 08:35:41'),
(18, 1, 7, 3, 12, 'expense', -25000, 'College pago', '2026-01-28', NULL, NULL, '2026-01-28 08:36:46'),
(19, 1, 7, 3, 7, 'expense', -15000, 'Pago tarjeta de credito', '2026-01-28', NULL, NULL, '2026-01-28 08:37:18'),
(20, 1, 7, 3, 4, 'expense', -53200, 'Ahorro renta', '2026-01-28', NULL, NULL, '2026-01-28 08:37:42'),
(21, 1, 7, 3, 11, 'expense', -3400, 'Claude', '2026-01-29', NULL, NULL, '2026-01-29 03:27:36'),
(22, 1, 7, 3, NULL, 'expense', -4500, 'Temu', '2026-01-29', NULL, NULL, '2026-01-29 06:43:21'),
(23, 1, 7, 3, 10, 'expense', -2100, 'Netflix', '2026-01-29', NULL, NULL, '2026-01-29 20:33:44');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `created_at`) VALUES
(1, 'Bryan', 'bryanglenx@gmail.com', '2025-10-09 06:23:51'),
(2, 'Yuleinys', 'yuleinys1999@gmail.com', '2025-10-09 06:23:51'),
(3, 'Prueba', 'prueba@gmail.com', '2025-11-11 10:29:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_accounts_user` (`user_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cat_user_name` (`user_id`,`name`);

--
-- Indexes for table `pay_periods`
--
ALTER TABLE `pay_periods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_paydate` (`user_id`,`pay_date`);

--
-- Indexes for table `planned_payments`
--
ALTER TABLE `planned_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pp_user_due` (`user_id`,`due_date`),
  ADD KEY `fk_planned_account` (`account_id`);

--
-- Indexes for table `saving_entries`
--
ALTER TABLE `saving_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_save_user_date` (`user_id`,`entry_date`),
  ADD KEY `fk_save_pay` (`pay_period_id`),
  ADD KEY `fk_save_account` (`account_id`);

--
-- Indexes for table `saving_entry_goals`
--
ALTER TABLE `saving_entry_goals`
  ADD PRIMARY KEY (`saving_entry_id`,`goal_id`),
  ADD KEY `fk_seg_goal` (`goal_id`);

--
-- Indexes for table `saving_goals`
--
ALTER TABLE `saving_goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_goal_user` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_txn_user_date` (`user_id`,`txn_date`),
  ADD KEY `idx_txn_payperiod` (`pay_period_id`),
  ADD KEY `fk_txn_account` (`account_id`),
  ADD KEY `fk_txn_category` (`category_id`),
  ADD KEY `fk_txn_planned` (`planned_payment_id`),
  ADD KEY `fk_txn_counterparty` (`counterparty_user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `pay_periods`
--
ALTER TABLE `pay_periods`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `planned_payments`
--
ALTER TABLE `planned_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `saving_entries`
--
ALTER TABLE `saving_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `saving_goals`
--
ALTER TABLE `saving_goals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `fk_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `pay_periods`
--
ALTER TABLE `pay_periods`
  ADD CONSTRAINT `fk_payperiods_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `planned_payments`
--
ALTER TABLE `planned_payments`
  ADD CONSTRAINT `fk_planned_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `fk_planned_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `saving_entries`
--
ALTER TABLE `saving_entries`
  ADD CONSTRAINT `fk_save_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `fk_save_pay` FOREIGN KEY (`pay_period_id`) REFERENCES `pay_periods` (`id`),
  ADD CONSTRAINT `fk_save_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `saving_entry_goals`
--
ALTER TABLE `saving_entry_goals`
  ADD CONSTRAINT `fk_seg_entry` FOREIGN KEY (`saving_entry_id`) REFERENCES `saving_entries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_seg_goal` FOREIGN KEY (`goal_id`) REFERENCES `saving_goals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `saving_goals`
--
ALTER TABLE `saving_goals`
  ADD CONSTRAINT `fk_goal_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_txn_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `fk_txn_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `fk_txn_counterparty` FOREIGN KEY (`counterparty_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_txn_payperiod` FOREIGN KEY (`pay_period_id`) REFERENCES `pay_periods` (`id`),
  ADD CONSTRAINT `fk_txn_planned` FOREIGN KEY (`planned_payment_id`) REFERENCES `planned_payments` (`id`),
  ADD CONSTRAINT `fk_txn_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
