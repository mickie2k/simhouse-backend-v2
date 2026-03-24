import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSimulatorReviewDto } from './dto/create-simulator-review.dto';
import { UpdateSimulatorReviewDto } from './dto/update-simulator-review.dto';
import { CreateCustomerReviewDto } from './dto/create-customer-review.dto';
import { UpdateCustomerReviewDto } from './dto/update-customer-review.dto';

@Injectable()
export class ReviewService {
    private readonly logger = new Logger(ReviewService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Create a simulator review (customer reviews simulator after completed booking)
     */
    async createSimulatorReview(
        customerId: number,
        bookingId: number,
        dto: CreateSimulatorReviewDto,
    ) {
        // 1. Verify booking exists and belongs to customer
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId, customerId },
            include: {
                bookingStatus: true,
                simulator: true,
                review: true,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.customerId !== customerId) {
            throw new ForbiddenException(
                'You can only review your own bookings',
            );
        }

        // 2. Check if booking is completed
        const isCompleted = booking.bookingStatus.id == 2;

        if (!isCompleted) {
            throw new BadRequestException(
                'You can only review completed bookings',
            );
        }

        // 3. Check if review already exists for this booking
        if (booking.review) {
            throw new BadRequestException(
                'Review already exists for this booking',
            );
        }

        // 4. Create the review with transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create the main review
            const review = await tx.simulatorReview.create({
                data: {
                    bookingId: bookingId,
                    overallRating: dto.overallRating,
                    comment: dto.comment,
                },
            });

            // Create detailed ratings if provided
            if (dto.reviewDetails && dto.reviewDetails.length > 0) {
                await tx.simulatorReviewList.createMany({
                    data: dto.reviewDetails.map((detail) => ({
                        reviewId: review.id,
                        typeId: detail.typeId,
                        rating: detail.rating,
                    })),
                });
            }

            // Return the complete review with details
            return tx.simulatorReview.findUnique({
                where: { id: review.id },
                include: {
                    reviewList: {
                        include: {
                            reviewType: true,
                        },
                    },
                    booking: {
                        include: {
                            simulator: true,
                            customer: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            });
        });

        this.logger.log(
            `Customer ${customerId} created simulator review for booking ${bookingId}`,
        );

        return result;
    }

    async getSimulatorReviewByBookingId(bookingId: number) {
        return await this.prisma.simulatorReview.findUnique({
            where: { bookingId },
        });
    }

    /**
     * Get all reviews for a specific simulator
     */
    async getSimulatorReviews(simulatorId: number) {
        // Verify simulator exists
        const simulator = await this.prisma.simulator.findUnique({
            where: { id: simulatorId },
        });

        if (!simulator) {
            throw new NotFoundException('Simulator not found');
        }

        const reviews = await this.prisma.simulatorReview.findMany({
            where: {
                booking: {
                    simId: simulatorId,
                },
            },
            include: {
                reviewList: {
                    include: {
                        reviewType: true,
                    },
                },
                booking: {
                    select: {
                        bookingDate: true,
                        customer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                id: 'desc',
            },
        });

        // Calculate average rating
        const totalRating = reviews.reduce(
            (sum, review) => sum + review.overallRating,
            0,
        );
        const averageRating =
            reviews.length > 0
                ? parseFloat((totalRating / reviews.length).toFixed(2))
                : 0;

        // Format actual reviews to match the requested format
        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];

        const reviewItems = reviews.map((review) => {
            const date = new Date(review.booking.bookingDate);
            return {
                id: review.id,
                reviewerName: review.booking.customer.firstName,
                reviewDate: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
                comment: review.comment || '',
            };
        });

        // Calculate real rating categories if we have reviews
        const ratingCategories: { label: string; value: number }[] = [];
        if (reviews.length > 0) {
            const categoryMap = new Map<
                string,
                { total: number; count: number }
            >();
            reviews.forEach((review) => {
                if (review.reviewList) {
                    review.reviewList.forEach((detail) => {
                        const label = detail.reviewType.typeName;
                        if (!categoryMap.has(label)) {
                            categoryMap.set(label, { total: 0, count: 0 });
                        }
                        const current = categoryMap.get(label)!;
                        current.total += detail.rating;
                        current.count += 1;
                    });
                }
            });

            if (categoryMap.size > 0) {
                categoryMap.forEach((data, label) => {
                    ratingCategories.push({
                        label,
                        value: Number((data.total / data.count).toFixed(1)),
                    });
                });
            }
        }

        return {
            simulatorId,
            totalReviews: reviewItems.length,
            averageRating,
            ratingCategories,
            reviewItems,
        };
    }

    /**
     * Update a simulator review (only by the creator)
     */
    async updateSimulatorReview(
        customerId: number,
        reviewId: number,
        dto: UpdateSimulatorReviewDto,
    ) {
        // Find the review and verify ownership
        const existingReview = await this.prisma.simulatorReview.findUnique({
            where: { id: reviewId },
            include: {
                booking: true,
                reviewList: true,
            },
        });

        if (!existingReview) {
            throw new NotFoundException('Review not found');
        }

        if (existingReview.booking.customerId !== customerId) {
            throw new ForbiddenException(
                'You can only update your own reviews',
            );
        }

        // Update in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Update main review fields
            const updated = await tx.simulatorReview.update({
                where: { id: reviewId },
                data: {
                    ...(dto.overallRating && {
                        overallRating: dto.overallRating,
                    }),
                    ...(dto.comment !== undefined && { comment: dto.comment }),
                },
            });

            if (!updated) {
                throw new NotFoundException('Review not found during update');
            }

            // Update detailed ratings if provided
            if (dto.reviewDetails && dto.reviewDetails.length > 0) {
                // Delete existing details
                await tx.simulatorReviewList.deleteMany({
                    where: { reviewId },
                });

                // Create new details
                await tx.simulatorReviewList.createMany({
                    data: dto.reviewDetails.map((detail) => ({
                        reviewId,
                        typeId: detail.typeId,
                        rating: detail.rating,
                    })),
                });
            }

            // Return updated review with details
            return tx.simulatorReview.findUnique({
                where: { id: reviewId },
                include: {
                    reviewList: {
                        include: {
                            reviewType: true,
                        },
                    },
                    booking: {
                        include: {
                            simulator: true,
                        },
                    },
                },
            });
        });

        this.logger.log(`Customer ${customerId} updated review ${reviewId}`);

        return result;
    }

    /**
     * Delete a simulator review (only by the creator)
     */
    async deleteSimulatorReview(customerId: number, reviewId: number) {
        const review = await this.prisma.simulatorReview.findUnique({
            where: { id: reviewId },
            include: {
                booking: true,
            },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.booking.customerId !== customerId) {
            throw new ForbiddenException(
                'You can only delete your own reviews',
            );
        }

        // Delete will cascade to reviewList due to relation
        await this.prisma.simulatorReview.delete({
            where: { id: reviewId },
        });

        this.logger.log(`Customer ${customerId} deleted review ${reviewId}`);

        return { message: 'Review deleted successfully' };
    }

    // ----------- Customer Reviews for Hosts ------------

    /**
     * Create a customer review (host reviews customer after completed booking)
     */
    async createCustomerReview(hostId: number, dto: CreateCustomerReviewDto) {
        // 1. Verify booking exists
        const booking = await this.prisma.booking.findUnique({
            where: {
                id: dto.bookingId,
            },
            include: {
                bookingStatus: true,
                simulator: {
                    include: {
                        host: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                customerReviews: true,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        // 2. Verify host owns the simulator
        if (booking.simulator.hostId !== hostId) {
            throw new ForbiddenException(
                'You can only review bookings for your own simulators',
            );
        }

        // 3. Check if booking is completed
        const isCompleted = booking.bookingStatus.id === 2;

        if (!isCompleted) {
            throw new BadRequestException(
                'You can only review completed bookings',
            );
        }

        // 4. Check if review already exists
        if (booking.customerReviews.length > 0) {
            throw new BadRequestException(
                'Review already exists for this booking',
            );
        }

        // 5. Create customer review
        const review = await this.prisma.customerReview.create({
            data: {
                bookingId: dto.bookingId,
                rating: dto.rating,
                comment: dto.comment,
            },
            include: {
                booking: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.log(
            `Host ${hostId} created customer review for booking ${dto.bookingId}`,
        );

        return review;
    }

    /**
     * Get all reviews for a specific customer
     */
    async getCustomerReviews(customerId: number) {
        // Verify customer exists
        const customer = await this.prisma.user.findUnique({
            where: { id: customerId },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        const reviews = await this.prisma.customerReview.findMany({
            where: {
                booking: {
                    customerId,
                },
            },
            include: {
                booking: {
                    select: {
                        bookingDate: true,
                        simulator: {
                            select: {
                                id: true,
                                simListName: true,
                                host: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate average rating
        const totalRating = reviews.reduce(
            (sum, review) => sum + review.rating,
            0,
        );
        const averageRating =
            reviews.length > 0 ? totalRating / reviews.length : 0;

        return {
            customerId,
            totalReviews: reviews.length,
            averageRating: parseFloat(averageRating.toFixed(2)),
            reviews,
        };
    }

    /**
     * Update a customer review (only by the host who created it)
     */
    async updateCustomerReview(
        hostId: number,
        reviewId: number,
        dto: UpdateCustomerReviewDto,
    ) {
        // Find the review
        const existingReview = await this.prisma.customerReview.findUnique({
            where: { id: reviewId },
            include: {
                booking: {
                    include: {
                        simulator: true,
                    },
                },
            },
        });

        if (!existingReview) {
            throw new NotFoundException('Review not found');
        }

        // Verify host owns the simulator
        if (existingReview.booking.simulator.hostId !== hostId) {
            throw new ForbiddenException(
                'You can only update your own reviews',
            );
        }

        // Update the review
        const updated = await this.prisma.customerReview.update({
            where: { id: reviewId },
            data: {
                ...(dto.rating && { rating: dto.rating }),
                ...(dto.comment !== undefined && { comment: dto.comment }),
            },
            include: {
                booking: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.log(`Host ${hostId} updated customer review ${reviewId}`);

        return updated;
    }

    /**
     * Delete a customer review (only by the host who created it)
     */
    async deleteCustomerReview(hostId: number, reviewId: number) {
        const review = await this.prisma.customerReview.findUnique({
            where: { id: reviewId },
            include: {
                booking: {
                    include: {
                        simulator: true,
                    },
                },
            },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.booking.simulator.hostId !== hostId) {
            throw new ForbiddenException(
                'You can only delete your own reviews',
            );
        }

        await this.prisma.customerReview.delete({
            where: { id: reviewId },
        });

        this.logger.log(`Host ${hostId} deleted customer review ${reviewId}`);

        return { message: 'Review deleted successfully' };
    }

    /**
     * Get review types for categorized ratings
     */
    async getReviewTypes() {
        return this.prisma.simulatorReviewType.findMany({
            orderBy: { id: 'asc' },
        });
    }
}
